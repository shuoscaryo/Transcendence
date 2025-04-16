from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
from django.utils import timezone
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model

online_users = set() # Used by the backend enpoints when getting friend list
user_rooms = {}  # Mapping: user_id -> room_name
active_rooms = {} # active_rooms: room_name -> { "players": [ { uid, channel_name, ready, role }, ... ], "game_state": {} }

async def delete_room(channel_layer, room_name, reason):
    if (room_name not in active_rooms):
        return
    
    # Broadcast that the game is over
    await channel_layer.group_send(
        room_name,
        {
            "type": "broadcast",
            "msg_type": "game_over",
            "data": {
                "reason": reason,
            }
        }
    )
    # remove all players from the channel and user_rooms
    for p in active_rooms[room_name]["players"]:
        await channel_layer.group_discard(room_name, p["channel_name"])
        user_rooms.pop(p["uid"])
    # Remove the room from active_rooms
    active_rooms.pop(room_name)

class PongConsumer(AsyncWebsocketConsumer):
    room_counter = 0

    async def connect(self):
        # Only authenticated users can connect
        if self.scope["user"].is_authenticated:
            await self.accept()
        else:
            self.errorClose = True
            await self.close()
            return
        self.uid = self.scope['user'].id

        # Initialize disconnect timer attribute; no timer is scheduled yet.
        self.disconnect_timer = None

        # Send to friends that this user is online
        await self.update_online_status(True)

    async def disconnect(self, close_code):
        # Don't execute if errorClose is set to True
        if hasattr(self, 'errorClose') and self.errorClose:
            return

        # update the user status to offline
        await self.update_online_status(False)

        # If the user is not in a room, nothing to do.
        room_name = user_rooms.get(self.uid)
        if room_name is None:
            return

        # if user is in matchmaking, remove the user from the room
        if len(active_rooms[room_name]["players"]) < 2:
            await self.stop_find_match_handler({})
            return
        
        # If the user is in a game, disconnect the user from the room
        await self.disconnected_handler({})
        
    def start_del_room_timer(self, room_name):
        # If the room has the timer ticking, we don't need to start another one
        if active_rooms[room_name].get("del_timer") is not None:
            return

        async def timeout_logic():
            try:
                await asyncio.sleep(10)
                await asyncio.shield(delete_room(self.channel_layer, room_name, "no_players"))
            except asyncio.CancelledError:
                return

        # Start the timer and save the task in the room
        active_rooms[room_name]["del_timer"] = asyncio.create_task(timeout_logic())

    def cancel_del_room_timer(self, room_name):
        timer = active_rooms[room_name].get("del_timer")
        if timer:
            timer.cancel()
            active_rooms[room_name]["del_timer"] = None

    async def receive(self, text_data):
        async def send_error(self, message):
            await self.send(text_data=json.dumps({'msg_type': 'error', 'data': {'message': message}}))
        # Parse JSON data from the WebSocket message.
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await send_error(self, "Invalid JSON format")
            return

        msg_type = data.get("msg_type")
        if not msg_type:
            await send_error(self, "Missing 'msg_type'")
            return

        handler = getattr(self, f"{msg_type}_handler", None)
        if handler and callable(handler):
            await handler(data)
        else:
            await send_error(self, f"Unknown message type: {msg_type}")

    async def broadcast(self, event):
        if not event or 'msg_type' not in event:
            raise ValueError("Missing 'msg_type' in the event.")
        if event.get('sender') == self.channel_name:
            return
        await self.send(text_data=json.dumps({
            'msg_type': event['msg_type'],
            'data': event.get('data', {})
        }))

    async def move_handler(self, data):
        # If user is not in a match, this msg is ignored
        if user_rooms.get(self.uid) is None or\
            len(active_rooms[user_rooms[self.uid]]["players"]) < 2:
            return

        # Send the move to the opponent (host)        
        await self.channel_layer.group_send(
            user_rooms[self.uid],
            {
                'type': 'broadcast',
                'msg_type': 'move_p',
                'sender': self.channel_name,
                'data': data,
            }
        )

    async def game_state_handler(self, data):
        # If user is not in a match, this msg is ignored
        if user_rooms.get(self.uid) is None or\
            len(active_rooms[user_rooms[self.uid]]["players"]) < 2:
            return

        # Update the game state in the active_rooms dictionary
        active_rooms[user_rooms[self.uid]]["game_state"] = data

        # Broadcast the game state to the opponent
        await self.channel_layer.group_send(
            user_rooms[self.uid],
            {
                'type': 'broadcast',
                'msg_type': 'game_state',
                'sender': self.channel_name,
                'data': data,
            }
        )

    async def find_match_handler(self, data):
        # If user already in a room this msg is ignored
        if user_rooms.get(self.uid) is not None:
            return

        # Find a room for the user and give role
        room_name = f'pong_room_{PongConsumer.room_counter}'
        last_room = active_rooms.get(room_name)
        if not last_room or len(last_room["players"]) >= 2:
            PongConsumer.room_counter += 1
            room_name = f'pong_room_{PongConsumer.room_counter}'
            active_rooms[room_name] = {"players": [], "game_state": {}}
        role = "host" if len(active_rooms[room_name]["players"]) == 0 else "client"

        # Add the room to the user_rooms mapping
        user_rooms[self.uid] = room_name
        # Add the user to the room
        active_rooms[room_name]["players"].append({
            "uid": self.uid,
            "channel_name": self.channel_name, # To force all disconnections when someone disconnects at the beginning
            "ready": False,
            "role": role,
        })
        # Connect the user to the group
        await self.channel_layer.group_add(room_name, self.channel_name)


        players = active_rooms[room_name]["players"]
        if len(players) >= 2:
            # If both players are in the room, send a match_found message
            await self.channel_layer.group_send(
                room_name,
                {
                    'type': 'broadcast',
                    'msg_type': 'match_found',
                }
            )

            # Start the timer to delete the room if players don't say ready
            self.start_del_room_timer(room_name)

    async def stop_find_match_handler(self, data):
        # If user is not in a room, or game has already started (len == 2), this msg is ignored
        if user_rooms.get(self.uid) is None or\
            len(active_rooms[user_rooms[self.uid]]["players"]) == 2:
            return
        
        # Remove the user from the active_rooms and user_rooms
        # The active room stays there even if empty
        players = active_rooms[user_rooms[self.uid]]["players"]
        active_rooms[user_rooms[self.uid]]["players"] = [
            p for p in players if p["uid"] != self.uid
        ]
        del user_rooms[self.uid]

    async def ready_handler(self, data):
        # If user is not in a match, this msg is ignored
        room_name = user_rooms.get(self.uid)
        if room_name is None or\
            len(active_rooms[room_name]["players"]) < 2:
            return
        
        # Mark the user as ready in the room
        players = active_rooms[room_name]["players"]
        for p in players:
            if p["uid"] == self.uid:
                p["ready"] = True
                break

        # Connect the user to the group
        await self.channel_layer.group_add(room_name, self.channel_name)
        
        # If Both players are ready, send a start_game message
        if all(p["ready"] for p in players):
            await self.channel_layer.group_send(
                room_name,
                {
                    'type': 'broadcast',
                    'msg_type': 'start_game',
                }
            )
            # Cancel the timer if it was running
            self.cancel_del_room_timer(room_name)

    async def disconnected_handler(self, data):
        # If user is not in a match, this msg is ignored
        room_name = user_rooms.get(self.uid)
        if room_name is None or\
            len(active_rooms[room_name]["players"]) < 2:
            return
        # Mark the user as not ready in the room
        players = active_rooms[room_name]["players"]
        for p in players:
            if p["uid"] == self.uid:
                p["ready"] = False
                break

        # remove self from the channel group
        await self.channel_layer.group_discard(room_name, self.channel_name)
        
        # start the timer to delete the room if the player don't reconnect
        self.start_del_room_timer(room_name)

        # If there is at least one online in the room, broadcast pause the game
        if any(p["ready"] for p in players):
            await self.channel_layer.group_send(
                room_name,
                {
                    "type": "broadcast",
                    "sender": self.channel_name,
                    "msg_type": "pause_game",
                }
            )
        # If all players are offline, delete the room
        else:
            # Cancel the timer if it was running
            self.cancel_del_room_timer(room_name)
            await delete_room(self.channel_layer, room_name, "no_players")
            
    async def game_over_handler(self, data):
        # If user is not in a match, this msg is ignored
        room_name = user_rooms.get(self.uid)
        if room_name is None or\
            len(active_rooms[room_name]["players"]) < 2:
            return
        # Delete the room of the player
        await delete_room(self.channel_layer, room_name, "no_players")


    async def update_online_status(self, is_connecting):
        CustomUser = get_user_model()
        user = await sync_to_async(CustomUser.objects.get)(id=self.uid)

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