from django.urls import re_path
from pong_project.consumers import PongConsumer

websocket_urlpatterns = [
    re_path(r'ws/game/$', PongConsumer.as_asgi()),  # Single game for two players
]
