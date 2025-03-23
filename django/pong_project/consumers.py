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

    async def connect(self):
        self.room_name = 'pong_room'
        self.room_group_name = f'game_{self.room_name}'

        # Añadir al grupo
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Registrar jugador
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

        # Enviar estado inicial al jugador actual
        await self.send(text_data=json.dumps({
            'initial_status': self.role,
            'players_connected': len(players)
        }))

        # Si hay 2 jugadores, notificar a todos
        if len(players) == 2:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'start_game',
                    'message': 'Ambos jugadores están conectados. ¡El juego comienza!'
                }
            )

        logger.info(f"Jugador conectado: {self.role}, total: {len(players)}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        if self.room_name in self.active_players and self in self.active_players[self.room_name]:
            self.active_players[self.room_name].remove(self)

        players = self.active_players.get(self.room_name, [])
        logger.info(f"Jugador desconectado: {self.role}, total: {len(players)}")

        # Notificar si quedan menos de 2 jugadores
        if len(players) < 2:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'waiting_message',
                    'message': 'Esperando al segundo jugador...'
                }
            )

        # Reasignar roles a los jugadores restantes
        if players:
            first_player_exists = any(p.role == 'first' for p in players)
            if not first_player_exists:
                players[0].role = 'first'
                await players[0].send(text_data=json.dumps({
                    'initial_status': 'first',
                    'players_connected': len(players)
                }))
                logger.info(f"Reasignado rol 'first' a {players[0].channel_name}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        logger.info(f"Mensaje recibido: {data}")
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_message',
                'move': data['move'],
                'sender': self.channel_name
            }
        )

    async def game_message(self, event):
        if event['sender'] != self.channel_name:
            await self.send(text_data=json.dumps({
                'move': event['move']
            }))
            logger.info(f"Movimiento reenviado: {event['move']}")

    async def start_game(self, event):
        await self.send(text_data=json.dumps({
            'start': True,
            'message': event['message']
        }))

    async def waiting_message(self, event):
        await self.send(text_data=json.dumps({
            'waiting': True,
            'message': event['message']
        }))