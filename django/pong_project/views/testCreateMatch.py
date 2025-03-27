from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_POST
import json
from pong_project.models import MatchHistory

CustomUser = get_user_model()

@require_POST
def add_match(request):
    try:
        data = json.loads(request.body)

        if not all(k in data for k in ['playerLeft', 'scoreLeft', 'scoreRight', 'duration', 'matchType']):
            return JsonResponse({'error': 'Missing required fields'}, status=400)

        try:
            score_left = int(data['scoreLeft'])
            score_right = int(data['scoreRight'])
            duration = int(data['duration'])
        except ValueError:
            return JsonResponse({'error': 'Invalid numeric values'}, status=400)

        match_type = data['matchType']
        if match_type not in dict(MatchHistory._meta.get_field('matchType').choices):
            return JsonResponse({'error': 'Invalid matchType'}, status=400)

        try:
            player_left = CustomUser.objects.get(display_name=data['playerLeft'])
        except CustomUser.DoesNotExist:
            return JsonResponse({'error': 'PlayerLeft does not exist'}, status=404)

        player_right = None
        if match_type == 'online':
            if 'playerRight' not in data:
                return JsonResponse({'error': 'Missing playerRight for online match'}, status=400)
            try:
                player_right = CustomUser.objects.get(display_name=data['playerRight'])
            except CustomUser.DoesNotExist:
                return JsonResponse({'error': 'PlayerRight does not exist'}, status=404)

        # Crear el partido
        match = MatchHistory.objects.create(
            playerLeft=player_left,
            playerRight=player_right,
            scoreLeft=score_left,
            scoreRight=score_right,
            duration=duration,
            matchType=match_type
        )

        # Actualizar estadísticas
        if score_left > score_right:
            player_left.wins += 1
            if player_right:
                player_right.losses += 1
        elif score_left < score_right:
            player_left.losses += 1
            if player_right:
                player_right.wins += 1
        player_left.save()
        if player_right:
            player_right.save()

        return JsonResponse({
            'message': 'Match added successfully',
            'match_id': match.id,
            'score': f"{score_left}-{score_right}"
        })
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
