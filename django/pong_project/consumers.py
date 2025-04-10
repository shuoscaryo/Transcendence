from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
from django.utils import timezone
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model

online_users = set()
user_rooms = {}  # Mapping: user_id -> room_name

class PongConsumer(AsyncWebsocketConsumer):
    # active_rooms: room_name -> { "players": [ { "consumer": ..., "online": True }, ... ], "state": {} }
    active_rooms = {}
    room_counter = 0

    async def connect(self):
        # Only authenticated users can connect
        if self.scope["user"].is_authenticated:
            await self.accept()
        else:
            self.errorClose = True
            await self.close(code=4000)
            return

        self.user_id = self.scope['user'].id
        # Initialize disconnect timer attribute; no timer is scheduled yet.
        self.disconnect_timer = None
        await self.update_online_status(True)

    async def disconnect(self, close_code):
        if close_code == 4000:
            return

        # Remove from channel group so this consumer stops receiving messages.
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        # Mark this player's record as offline inside the room, if it exists.
        if hasattr(self, 'room_name'):
            players = self.active_rooms.get(self.room_name, {}).get("players", [])
            for p in players:
                if p["consumer"] == self:
                    p["online"] = False
                    break

            # Check if there is any opponent that is still online.
            opponent_online = any(
                p["consumer"].user_id != self.user_id and p["online"]
                for p in players
            )

            # If there is at least one online opponent, broadcast that this player disconnected.
            if opponent_online:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "broadcast",
                        "msg_type": "player_disconnected",
                        "data": {"user_id": self.user_id}
                    }
                )

            # If all players in this room are offline, clean up the room immediately.
            if all(not p["online"] for p in players):
                user_ids = [p["consumer"].user_id for p in players]
                for uid in user_ids:
                    user_rooms.pop(uid, None)
                self.active_rooms.pop(self.room_name, None)
            else:
                # Otherwise, if at least one opponent is online, start the disconnect timer.
                # This will wait 10 seconds and then take further action if the player hasn't reconnected.
                self.disconnect_timer = asyncio.create_task(self.handle_disconnection_timeout())

        # Finally, update the online status of the user.
        await self.update_online_status(False)


    async def handle_disconnection_timeout(self):
        """
        Wait 10 seconds; if the player is still offline in the room, send a notification
        to the room (for example, to end the game or notify the opponent).
        """
        try:
            await asyncio.sleep(10)
        except asyncio.CancelledError:
            # Timer was canceled because the player reconnected
            return

        # If room_name is not set, nothing to do.
        if not hasattr(self, 'room_name'):
            return

        players = self.active_rooms.get(self.room_name, {}).get("players", [])
        # Check this player's record; if still offline, then take action.
        for p in players:
            if p["consumer"].user_id == self.user_id:
                if not p["online"]:
                    # Player has not reconnected within 10 seconds.
                    # Check if the opponent is still online.
                    opponent = next((x for x in players if x["consumer"].user_id != self.user_id and x["online"]), None)
                    if opponent:
                        # Notify the room that the opponent has disconnected permanently.
                        await self.channel_layer.group_send(
                            self.room_group_name,
                            {
                                "type": "broadcast",
                                "msg_type": "opponent_disconnected_permanently",
                                "data": {"user_id": self.user_id}
                            }
                        )
                break

    async def receive(self, text_data):
        # Parse JSON data from the WebSocket message.
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'msg_type': 'error',
                'message': "Invalid JSON"
            }))
            return

        msg_type = data.get("msg_type")
        if not msg_type:
            await self.send(text_data=json.dumps({
                'msg_type': 'error',
                'message': "Didn't receive a message type"
            }))
            return

        handler = getattr(self, f"{msg_type}_handler", None)
        if handler and callable(handler):
            await handler(data)
        else:
            await self.send(text_data=json.dumps({
                'msg_type': 'error',
                'message': f'Invalid message type {msg_type}'
            }))

    async def broadcast(self, event):
        if 'msg_type' not in event:
            raise ValueError("Missing 'msg_type' in the event.")
        if event.get('sender') == self.channel_name:
            return
        await self.send(text_data=json.dumps({
            'msg_type': event['msg_type'],
            'data': event.get('data', {})
        }))

    async def move_handler(self, data):
        if not hasattr(self, 'room_group_name'):
            await self.send(text_data=json.dumps({
                'msg_type': 'error',
                'message': "move_handler: No room group name"
            }))
            return
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast',
                'msg_type': 'move_p',
                'sender': self.channel_name,
                'data': data,
            }
        )

    async def update_online_status(self, is_connecting):
        CustomUser = get_user_model()
        user = await sync_to_async(CustomUser.objects.get)(id=self.user_id)

        if is_connecting:
            if not user.is_authenticated:
                return
            await self.channel_layer.group_add(f'user_{user.id}', self.channel_name)
            online_users.add(user.id)
        else:
            await self.channel_layer.group_discard(f'user_{user.id}', self.channel_name)
            online_users.discard(user.id)

        user.last_online = timezone.now()
        await sync_to_async(user.save)()

        friend_list = await sync_to_async(lambda: list(user.friends.all()))()
        tasks = [
            self.channel_layer.group_send(
                f'user_{friend.id}',
                {
                    'type': 'broadcast',
                    'msg_type': 'online_status',
                    'data': {
                        'is_online': is_connecting,
                        'display_name': user.display_name,
                        'last_online': None if is_connecting else user.last_online.isoformat()
                    }
                }
            )
            for friend in friend_list
        ]
        await asyncio.gather(*tasks)

    async def game_state_handler(self, data):
        # Get the current room information
        room = self.active_rooms.get(self.room_name, {})
        
        # Save/update the current game state in the room
        # This completely overwrites the previous state; you could also merge if needed.
        room["state"] = data

        # Now, broadcast the game state to the opponent
        players = room.get("players", [])
        for p in players:
            if p["consumer"] != self and p["online"]:
                try:
                    await p["consumer"].send(text_data=json.dumps({
                        'msg_type': 'game_state',
                        'data': data,
                    }))
                except Exception as e:
                    print(f"[WARNING] Failed to send to user_id={getattr(p['consumer'], 'user_id', '?')}: {e}")
                    p["online"] = False

    async def find_or_create_room(self):
        for name, room in self.active_rooms.items():
            if len(room["players"]) < 2:
                return name

        PongConsumer.room_counter += 1
        new_room = f'pong_room_{PongConsumer.room_counter}'
        self.active_rooms[new_room] = {"players": [], "state": {}}  # empty state placeholder
        return new_room

    async def find_match_handler(self, data):
        # Check if user needs to reconnect
        existing_room = user_rooms.get(self.user_id)
        if existing_room and existing_room in self.active_rooms:
            await self.reconnect_handler(data)
            return

        self.room_name = await self.find_or_create_room()
        user_rooms[self.user_id] = self.room_name
        self.room_group_name = f'game_{self.room_name}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        self.active_rooms[self.room_name]["players"].append({
            "consumer": self,
            "online": True
        })

        players = self.active_rooms[self.room_name]["players"]
        self.role = 'first' if len(players) == 1 else 'second'

        if len(players) >= 2:
            CustomUser = get_user_model()
            player_left = await sync_to_async(CustomUser.objects.get)(id=players[0]["consumer"].user_id)
            player_right = await sync_to_async(CustomUser.objects.get)(id=players[1]["consumer"].user_id)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'match_found_response',
                    'player_left': player_left.display_name,
                    'player_right': player_right.display_name,
                }
            )

    async def stop_find_match_handler(self, data):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        if hasattr(self, 'room_name'):
            if self.room_name in self.active_rooms:
                players = self.active_rooms[self.room_name]["players"]
                self.active_rooms[self.room_name]["players"] = [
                    p for p in players if p["consumer"] != self
                ]
                if not self.active_rooms[self.room_name]["players"]:
                    del self.active_rooms[self.room_name]

    async def match_found_response(self, event):
        await self.send(text_data=json.dumps({
            'msg_type': 'match_found',
            'data': {
                'player_left': event.get('player_left'),
                'player_right': event.get('player_right'),
                'player_role': self.role,
                'room': self.room_name,
            }
        }))

    async def reconnect_handler(self, data):
        # Retrieve the room from user_rooms using the user's id
        room = user_rooms.get(self.user_id)
        if not room or room not in self.active_rooms:
            await self.send(text_data=json.dumps({
                "msg_type": "reconnect_failed",
                "data": {"message": "No active game found"}
            }))
            return

        # Cancel any pending disconnect timer since the player has reconnected
        if hasattr(self, 'disconnect_timer') and self.disconnect_timer is not None:
            self.disconnect_timer.cancel()
            self.disconnect_timer = None

        # Reassign room attributes
        self.room_name = room
        self.room_group_name = f'game_{self.room_name}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        # Update the player's record in the room to mark them as online
        players = self.active_rooms[self.room_name]["players"]
        for p in players:
            if p["consumer"].user_id == self.user_id:
                # Preserve the existing role and update the consumer to the new instance
                self.role = getattr(p["consumer"], 'role', None)
                p["consumer"] = self
                p["online"] = True
                break

        # Optionally, update the room's game state via match_found_response. Here, we fetch user details:
        CustomUser = get_user_model()
        # For a 2-player game, assuming players[0] is player_left and players[1] is player_right.
        player_left = await sync_to_async(CustomUser.objects.get)(id=players[0]["consumer"].user_id)
        player_right = await sync_to_async(CustomUser.objects.get)(id=players[1]["consumer"].user_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'match_found_response',
                'player_left': player_left.display_name,
                'player_right': player_right.display_name,
            }
        )

        # Broadcast to the room that the opponent has reconnected,
        # so the other player(s) are notified
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "broadcast",
                "msg_type": "opponent_reconnected",
                "data": {
                    "user_id": self.user_id,
                    "room_state": self.active_rooms[self.room_name]["state"]
                }
            }
        )

    async def match_end_handler(self, data):
        # Leave the group so this consumer stops receiving messages
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        # Extract user_ids from the players in the room
        players = self.active_rooms.get(self.room_name, {}).get("players", [])
        user_ids = [p["consumer"].user_id for p in players]
        # Remove the room from active_rooms
        self.active_rooms.pop(self.room_name, None)
        # Clean up user_rooms mapping for users in this room
        for uid in user_ids:
            user_rooms.pop(uid, None)
        self.room_name = None
        self.room_group_name = None
