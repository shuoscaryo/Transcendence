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
                        'type': 'waiting_message',
                        'message': 'Waiting for second player...'
                    }
                )
                if not any(p.role == 'first' for p in players):
                    players[0].role = 'first'
                    await players[0].send(text_data=json.dumps({
                        'msg_type': 'initial_status',
                        'initial_status': 'first',
                        'players_connected': len(players)
                    }))

        await self.update_online_status(False)

    async def receive(self, text_data):
        '''
            Called when a message is received from the WebSocket.
            The message is parsed as JSON and the 'msg_type' is used to call the corresponding handler.
            To add a new message type, create a method named <msg_type>_handler.
        '''
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'msg_type': 'error', 'message': "Invalid JSON"}))
            return

        msg_type = data.get("msg_type")
        if not msg_type:
            await self.send(text_data=json.dumps({'msg_type': 'error', 'message': "Didn't receive a message type"}))
            return

        handler_name = f"{msg_type}_handler"
        handler = getattr(self, handler_name, None)
        if handler and callable(handler):
            await handler(data)
        else:
            await self.send(text_data=json.dumps({'msg_type': 'error', 'message': f'Invalid message type {msg_type}'}))

        if msg_type == "move":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'player_move',
                    'move': data['move'],
                    'sender': self.channel_name
                }
            )

    async def move_handler(self, data):
        '''
            Called when a 'move' message is received.
            Sends the move to the other player in the room.
        '''
        if (!hasattr(self, 'room_group_name')):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_move',
                'move': data['move'],
                'sender': self.channel_name
            }
        )

    async def game_message(self, event):
        await self.send(text_data=json.dumps({
            'msg_type': 'match_found',
            'message': event.get('message'),
            'move': event.get('move'),
            'player_left': event.get('player_left'),
            'player_right': event.get('player_right'),
            'player_role': self.role,
        }))

    async def waiting_message(self, event):
        await self.send(text_data=json.dumps({
            'msg_type': 'waiting',
            'message': event['message']
        }))

    async def player_move(self, event):
        if event.get('sender') == self.channel_name:
            return  # Don't send back to the sender
        await self.send(text_data=json.dumps({
            'msg_type': 'move_p',
            'move': event.get('move'),
        }))

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
                    'type': 'normal_send',
                    'msg_type': 'online_status',
                    'is_online': is_connecting,
                    'display_name': user.display_name,
                    'last_online': None if is_connecting else user.last_online.isoformat()
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
                data_to_send = data.copy()
                data_to_send['msg_type'] = 'game_state'
                await player.send(text_data=json.dumps(data_to_send))

    async def normal_send(self, message):
        '''
            Sends a message to the user's frontend.
            For group_send types, all users in the room will receive it.
        '''
        if 'msg_type' not in message:
            raise ValueError("Missing 'msg_type' in the message.")
        message_to_send = message.copy()
        message_to_send.pop('type', None)
        await self.send(text_data=json.dumps(message_to_send))

    async def find_match_handler(self, data):
        self.room_name = await self.find_or_create_room()
        self.room_group_name = f'game_{self.room_name}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        self.active_players[self.room_name].append(self)

        players = self.active_players[self.room_name]
        self.role = 'first' if len(players) == 1 else 'second'

        if len(players) < 2:
            await self.send(text_data=json.dumps({
                'msg_type': 'waiting',
                'message': 'Waiting for the second player...'
            }))
        else:
                CustomUser = get_user_model()
                player_left = await sync_to_async(CustomUser.objects.get)(id=players[0].user_id)
                player_right = await sync_to_async(CustomUser.objects.get)(id=players[1].user_id)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_message',
                        'message': 'Both players are ready. The game begins!',
                        'player_left': player_left.display_name,
                        'player_right': player_right.display_name,
                    }
                )

    async def find_or_create_room(self):
        for name, players in self.active_players.items():
            if len(players) < 2:
                return name

        PongConsumer.room_counter += 1
        new_room = f'pong_room_{PongConsumer.room_counter}'
        self.active_players[new_room] = []
        return new_room
