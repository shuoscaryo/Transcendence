from django.urls import re_path
from pong_project.consumers import PongConsumer  # Updated to use PongConsumer

websocket_urlpatterns = [
    re_path(r'ws/game/$', PongConsumer.as_asgi()),  # New WebSocket route for the game
]
