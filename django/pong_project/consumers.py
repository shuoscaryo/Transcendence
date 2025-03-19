import json
from channels.generic.websocket import AsyncWebsocketConsumer

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Called when a client connects to WebSocket."""
        self.room_name = "pong_game"
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()
        print(f"🎮 Player connected: {self.channel_name}")

    async def disconnect(self, close_code):
        """Called when a client disconnects."""
        await self.channel_layer.group_discard(self.room_name, self.channel_name)
        print(f"❌ Player disconnected: {self.channel_name}")

    async def receive(self, text_data):
        """Handles received key events from players."""
        data = json.loads(text_data)
        key_event = data.get("key")  # Key pressed by player

        # Send key event to all players
        await self.channel_layer.group_send(
            self.room_name,
            {
                "type": "game_event",
                "key": key_event,
            },
        )

    async def game_event(self, event):
        """Sends key event data to all connected WebSocket clients."""
        await self.send(text_data=json.dumps({
            "key": event["key"]
        }))
