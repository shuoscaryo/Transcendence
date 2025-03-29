from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
from django.utils import timezone
from asgiref.sync import sync_to_async

online_users = set()

class PongConsumer(AsyncWebsocketConsumer):
    active_players = {}  # Diccionario para rastrear jugadores por sala
    ready_players = {}   # Diccionario para rastrear jugadores listos por sala

    async def connect(self):
    # Accept the connection only if the user is authenticated
        #if self.scope['user'].is_authenticated:
        await self.accept()
        #else:
        #    self.errorClose = True
        #    await self.close(code=403)
        #    return
        self.user = self.scope['user']

    # Online Match management
        self.room_name = 'pong_room'
        self.room_group_name = f'game_{self.room_name}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        
    # Online-status management
        await self.update_online_status(True)

    async def disconnect(self, close_code):
        if hasattr(self, 'errorClose') and self.errorClose:
            return
    # Online Match management
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        if self.room_name in self.active_players and self in self.active_players[self.room_name]:
            self.active_players[self.room_name].remove(self)

        if self.room_name in self.ready_players:
            self.ready_players[self.room_name] = [
                p for p in self.ready_players[self.room_name] if p != self
            ]

        players = self.active_players.get(self.room_name, [])

        if len(players) < 2:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'waiting_message',
                    'message': 'Esperando al segundo jugador...'
                }
            )

        if players:
            first_player_exists = any(p.role == 'first' for p in players)
            if not first_player_exists:
                players[0].role = 'first'
                await players[0].send(text_data=json.dumps({
                    'msg_type': 'initial_status',
                    'initial_status': 'first',
                    'players_connected': len(players)
                }))
        
    # Online-status management
        await self.update_online_status(False)

    async def receive(self, text_data):
        '''
            This method is called when a message is received from the WebSocket.
            The message is parsed as JSON and the 'msg_type' is used to call the corresponding handler.
            To add a new message type, create a new method inside the class with the name <msg_type>_handler.
        '''
    # General message handling
        data = json.loads(text_data)

        # get the message type
        msg_type = data.get("msg_type")
        if not msg_type:
            await self.send(text_data=json.dumps({'msg_type':  'error', 'message': 'Didn\'t receive a message type'}))
            return

        # Find and call the <msg_type>_handler method
        handler_name = f"{msg_type}_handler"
        handler = getattr(self, handler_name, None)
        if handler and callable(handler):
            await handler(data)
        else:
            # Don't send the error msg yet, delete the code below first
            # TODO uncomment the line below and remove pass when function is cleaned up
            #await self.send(text_data=json.dumps({'msg_type': 'error', 'message': f'Invalid message type {msg_type}'}))
            pass
    
    # Online Match management
        if msg_type == "init":
            if self.room_name not in self.active_players:
                self.active_players[self.room_name] = []
            players = self.active_players[self.room_name]

            # Limpiar jugadores inactivos
            active_players = []
            for player in players:
                await player.send(text_data=json.dumps({'msg_type': 'ping'}))
                active_players.append(player)
            players[:] = active_players

            # Añadir el nuevo jugador
            players.append(self)

            # Asignar roles dinámicamente
            first_player_exists = any(p.role == 'first' for p in players if p != self)
            self.role = 'first' if not first_player_exists else 'second'
        elif msg_type == "get_role":
            players = self.active_players.get(self.room_name, [])
            await self.send(text_data=json.dumps({
                'msg_type': 'initial_status',
                'initial_status': self.role,
                'players_connected': len(players)
            }))
        elif msg_type == "move":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'player_move',
                    'move': data['move'],
                    'sender': self.channel_name
                }
            )
        elif msg_type == "player_ready":
            self.ready_players[self.room_name] = self.ready_players.get(self.room_name, [])
            ready_players = self.ready_players[self.room_name]

            if self not in ready_players:
                ready_players.append(self)

            if len(ready_players) >= 2:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_message',
                        'message': 'Ambos jugadores están listos. ¡El juego comienza!'
                    }
                )
                self.ready_players[self.room_name] = []

    async def game_message(self, event):
        await self.send(text_data=json.dumps({
            'msg_type': 'start_game',
            'message': event.get('message'),
            'move': event.get('move')
        }))

    async def waiting_message(self, event):
        await self.send(text_data=json.dumps({
            'msg_type': 'espera',
            'message': event['message']
        }))

    async def player_move(self, event):
        if event.get('sender') == self.channel_name:
            return  # No se lo mandes a quien lo envió
        await self.send(text_data=json.dumps({
			'msg_type': 'move_p',
			'move': event.get('move'),
		}))

    async def update_online_status(self, is_connecting):
        # When connecting create own room and add self to online_users set and remove when disconnecting
        if is_connecting:
            if not self.user.is_authenticated:
                return
            await self.channel_layer.group_add(f'user_{self.user.id}', self.channel_name)
            online_users.add(self.user.id)
        else:
            await self.channel_layer.group_discard(f'user_{self.user.id}', self.channel_name)
            online_users.discard(self.user.id)

        # update the user's last_online field
        self.user.last_online = timezone.now()
        await sync_to_async(self.user.save)()

        # Get friend list and send online status to all of them (in parallel)
        friend_list = await sync_to_async(lambda: list(self.user.friends.all()))()
        tasks = [
            self.channel_layer.group_send(
                f'user_{friend.id}',
                {
                    'type': 'normal_send',
                    'msg_type': 'online_status',
                    'is_online': is_connecting,
                    'display_name': self.user.display_name,
                    'last_online': None if is_connecting else self.user.last_online.isoformat()
                }
            )
            for friend in friend_list
        ]
        await asyncio.gather(*tasks)
    
    async def game_state_handler(self, data):
        '''
            This method is called when a 'game_state' message is received.
            It sends the game state to the other player in the room.
        '''
        players = self.active_players.get(self.room_name, [])
        for player in players:
            if player != self:  # enviar solo al otro
                dataToSend = data.copy()
                dataToSend['msg_type'] = 'game_state'
                await player.send(text_data=json.dumps(dataToSend))
    
    async def normal_send(self, message):
        '''
            This method is used to send messages to the user's frontend.
            If it's the type of group_send, every user in the room will receive the message.
        '''
        if 'msg_type' not in message:
            raise ValueError("Forgot your 'msg_type' in the message ;)")
        # TODO If I'm in the same group, I don't need to send the message to myself
        message_to_send = message.copy()
        message_to_send.pop('type', None)
        await self.send(text_data=json.dumps(message_to_send))
