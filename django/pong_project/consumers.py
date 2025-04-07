from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
from django.utils import timezone
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model

online_users = set()

class PongConsumer(AsyncWebsocketConsumer):
    active_players = {}  # Dictionary to track players per room
    room_counter = 0     # Counter for unique room names

    async def connect(self):
        # Only authenticated users can connect
        if (self.scope["user"].is_authenticated):
            await self.accept()
        else:
            self.errorClose = True
            await self.close(code = 4000)
            return
        self.user_id = self.scope['user'].id

        await self.update_online_status(True)

    async def disconnect(self, close_code):
        if (close_code == 4000):
            return

        # Remove from channel group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        # Remove from matchmaking
        if hasattr(self, 'room_name'):
            if self.room_name in self.active_players:
                self.active_players[self.room_name] = [
                    p for p in self.active_players[self.room_name] if p != self
                ]
                if not self.active_players[self.room_name]:
                    del self.active_players[self.room_name]

            players = self.active_players.get(self.room_name, [])
            if len(players) == 1:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'broadcast',
                        'msg_type': 'wait_for_opponent',
                    }
                )

        await self.update_online_status(False)

    async def receive(self, text_data):
        '''
            Called when a message is received from the WebSocket.
            The message is parsed as JSON and the 'msg_type' is used to call the corresponding handler.
            To add a new message type, create a method named <msg_type>_handler.
        '''
        # Load the JSON data
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'msg_type': 'error', 'message': "Invalid JSON"}))
            return

        # Check if the message has a 'msg_type'
        msg_type = data.get("msg_type")
        if not msg_type:
            await self.send(text_data=json.dumps({'msg_type': 'error', 'message': "Didn't receive a message type"}))
            return

        # Call the appropriate handler based on the 'msg_type'
        handler_name = f"{msg_type}_handler"
        handler = getattr(self, handler_name, None)
        if handler and callable(handler):
            await handler(data)
        else:
            await self.send(text_data=json.dumps({'msg_type': 'error', 'message': f'Invalid message type {msg_type}'}))

    async def broadcast(self, event):
        '''
        Sends a message to the user's frontend.
        Skips if sender is the same as this connection.
        Requires 'msg_type' at the top level.
        Sends:
        {
            "msg_type": "...",
            "data": { ... }
        }
        '''
        if 'msg_type' not in event:
            raise ValueError("Missing 'msg_type' in the event.")

        if event.get('sender') == self.channel_name:
            return

        await self.send(text_data=json.dumps({
            'msg_type': event['msg_type'],
            'data': event.get('data', {})
        }))

    async def move_handler(self, data):
        '''
            Called when a 'move' message is received.
            Sends the move to the other player in the room.
        '''
        if not hasattr(self, 'room_group_name'):
            await self.send(text_data=json.dumps({'msg_type': 'error', 'message': "move_handler: No room group name"}))
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
        '''
            Called when a 'game_state' message is received.
            Sends the game state to the other player in the room.
        '''
        players = self.active_players.get(self.room_name, [])
        for player in players:
            if player != self:
                await player.send(text_data=json.dumps({
                    'msg_type': 'game_state',
                    'data': data,
                }))

    async def find_match_handler(self, data):
        self.room_name = await self.find_or_create_room()
        self.room_group_name = f'game_{self.room_name}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        self.active_players[self.room_name].append(self)

        players = self.active_players[self.room_name]
        self.role = 'first' if len(players) == 1 else 'second'

        if len(players) >= 2:
            CustomUser = get_user_model()
            player_left = await sync_to_async(CustomUser.objects.get)(id=players[0].user_id)
            player_right = await sync_to_async(CustomUser.objects.get)(id=players[1].user_id)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'match_found_response',
                    'player_left': player_left.display_name,
                    'player_right': player_right.display_name,
                }
            )

    async def match_found_response(self, event):
        await self.send(text_data=json.dumps({
            'msg_type': 'match_found',
            'data': {
                'player_left': event.get('player_left'),
                'player_right': event.get('player_right'),
                'player_role': self.role,
            }
        }))

    async def find_or_create_room(self):
        for name, players in self.active_players.items():
            if len(players) < 2:
                return name

        PongConsumer.room_counter += 1
        new_room = f'pong_room_{PongConsumer.room_counter}'
        self.active_players[new_room] = []
        return new_room
