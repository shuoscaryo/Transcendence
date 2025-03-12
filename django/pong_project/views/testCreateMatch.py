from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_POST
import json
from ..models import MatchHistory

CustomUser = get_user_model()

@require_POST
def add_match(request):
    """Añade un MatchHistory con jugadores, scores y tipo personalizados."""
    try:
        data = json.loads(request.body)
        # Obtener o crear jugadores
        player_left_username = data.get('playerLeft')
        player_right_username = data.get('playerRight')
        
        player_left, created_left = CustomUser.objects.get_or_create(
            username=player_left_username,
            defaults={'email': f'{player_left_username}@example.com', 'password': 'defaultpass'}
        )
        player_right, created_right = CustomUser.objects.get_or_create(
            username=player_right_username,
            defaults={'email': f'{player_right_username}@example.com', 'password': 'defaultpass'}
        )

        # Obtener datos del match
        score_left = int(data.get('scoreLeft'))
        score_right = int(data.get('scoreRight'))
        duration = int(data.get('duration', 120))  # Default 120 segundos si no se especifica
        match_type = data.get('match_type', 'local')  # Default 'local' si no se especifica

        # Validar que el match_type sea válido
        if match_type not in dict(MatchHistory._meta.get_field('match_type').choices):
            return JsonResponse({'error': 'Invalid match_type'}, status=400)

        # Crear el match
        match = MatchHistory.objects.create(
            playerLeft=player_left,
            playerRight=player_right,
            scoreLeft=score_left,
            scoreRight=score_right,
            duration=duration,
            match_type=match_type
        )

        # Actualizar wins/losses (simplificado)
        if score_left > score_right:
            player_left.wins += 1
            player_right.losses += 1
        else:
            player_left.losses += 1
            player_right.wins += 1
        player_left.save()
        player_right.save()

        return JsonResponse({
            'message': 'Match added successfully',
            'match_id': match.id,
            'score': f"{score_left}-{score_right}"
        })
    except ValueError as e:
        return JsonResponse({'error': 'Invalid numeric values'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)