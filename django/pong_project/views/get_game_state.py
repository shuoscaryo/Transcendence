from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from ..consumers import user_rooms, active_rooms
from django.contrib.auth import get_user_model

CustomUser = get_user_model()

@login_required
def get_game_state(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    user_id = request.user.id
    room_name = user_rooms.get(user_id)

    # IF the user is not in a full room, it's not in a game
    if not room_name:
        return JsonResponse({'in_game': False}, status=200)

    room = active_rooms.get(room_name)
    if not room or len(room["players"]) < 2:
        return JsonResponse({'in_game': False}, status=200)

    players = room["players"]
    player_left = CustomUser.objects.get(id=players[0]["uid"])
    player_right = CustomUser.objects.get(id=players[1]["uid"])
    game_state = room.get("game_state", {})

    return JsonResponse({
        'in_game': True,
        'player_left': {
            'uid': player_left.id,
            'display_name': player_left.display_name,
        },
        'player_right': {
            'uid': player_right.id,
            'display_name': player_right.display_name,
        },
        'role': players[0]["role"] if players[0]["uid"] == user_id else players[1]["role"],
        'room_name': room_name, # Test
        'me': user_id, # Test
        'game_state': game_state
    }, status=200)
