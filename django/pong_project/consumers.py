# consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json
import logging
from datetime import datetime

# Configuración del logging
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
        players.append(self)

        # Enviar estado inicial
        initial_status = 'first' if len(players) == 1 else 'second'
        await self.send(text_data=json.dumps({
            'initial_status': initial_status
        }))

        logger.info(f"Jugador conectado: {initial_status}, total: {len(players)}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        if self in self.active_players.get(self.room_name, []):
            self.active_players[self.room_name].remove(self)
        logger.info(f"Jugador desconectado, total: {len(self.active_players.get(self.room_name, []))}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        logger.info(f"Mensaje recibido: {data}")
        # Reenviar el movimiento a todos los demás en el grupo
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_message',
                'move': data['move'],
                'sender': self.channel_name
            }
        )

    async def game_message(self, event):
        # Enviar el movimiento solo al otro jugador
        if event['sender'] != self.channel_name:
            await self.send(text_data=json.dumps({
                'move': event['move']
            }))
            logger.info(f"Movimiento reenviado a otro jugador: {event['move']}")