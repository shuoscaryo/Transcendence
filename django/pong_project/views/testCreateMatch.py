from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_POST
import json
from ..models import MatchHistory

CustomUser = get_user_model()

@require_POST
def add_match(request):
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
        matchType = data.get('matchType', 'local')  # Default 'local' si no se especifica

        # Validar que el matchType sea válido
        if matchType not in dict(MatchHistory._meta.get_field('matchType').choices):
            return JsonResponse({'error': 'Invalid matchType'}, status=400)

        # Crear el match
        match = MatchHistory.objects.create(
            playerLeft=player_left,
            playerRight=player_right,
            scoreLeft=score_left,
            scoreRight=score_right,
            duration=duration,
            matchType=matchType
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