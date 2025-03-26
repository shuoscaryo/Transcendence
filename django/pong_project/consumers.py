# consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json
import logging
import asyncio

logging.basicConfig(
    filename='log.txt',
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

class PongConsumer(AsyncWebsocketConsumer):
    active_players = {}  # Diccionario para rastrear jugadores por sala
    ready_players = {}   # Diccionario para rastrear jugadores listos por sala

    async def connect(self):
        self.room_name = 'pong_room'
        self.room_group_name = f'game_{self.room_name}'

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        if self.room_name in self.active_players and self in self.active_players[self.room_name]:
            self.active_players[self.room_name].remove(self)

        if self.room_name in self.ready_players:
            self.ready_players[self.room_name] = [
                p for p in self.ready_players[self.room_name] if p != self
            ]

        players = self.active_players.get(self.room_name, [])
        logger.info(f"Jugador desconectado: {self.role}, total: {len(players)}")

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
                    'type': 'initial_status',
                    'initial_status': 'first',
                    'players_connected': len(players)
                }))
                logger.info(f"Reasignado rol 'first' a {players[0].channel_name}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        logger.info(f"Mensaje recibido: {data}")

        if data.get("type") == "init":
            if self.room_name not in self.active_players:
                self.active_players[self.room_name] = []
            players = self.active_players[self.room_name]

            # Limpiar jugadores inactivos
            active_players = []
            for player in players:
                try:
                    await player.send(text_data=json.dumps({'ping': True}))
                    active_players.append(player)
                except:
                    logger.info(f"Jugador inactivo detectado y eliminado: {player.channel_name}")
            players[:] = active_players

            # Añadir el nuevo jugador
            players.append(self)

            # Asignar roles dinámicamente
            first_player_exists = any(p.role == 'first' for p in players if p != self)
            self.role = 'first' if not first_player_exists else 'second'

            logger.info(f"Jugador registrado en init: {self.role}, total: {len(players)}")

        elif data.get("type") == "get_role":
            players = self.active_players.get(self.room_name, [])
            await self.send(text_data=json.dumps({
                'type': 'initial_status',
                'initial_status': self.role,
                'players_connected': len(players)
            }))

        elif data.get("type") == "move":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'player_move',
                    'move': data['move'],
                    'sender': self.channel_name
                }
            )

        elif data.get("type") == "player_ready":
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
            'type': 'start_game',
            'message': event.get('message'),
            'move': event.get('move')
        }))

    async def waiting_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'espera',
            'message': event['message']
        }))

    async def player_move(self, event):
          if event.get('sender') == self.channel_name:
               return  # No se lo mandes a quien lo envió
          await self.send(text_data=json.dumps({
			'type': 'move_p',
			'move': event.get('move'),
		}))
