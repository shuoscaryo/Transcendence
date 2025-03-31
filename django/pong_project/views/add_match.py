from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.contrib.auth import get_user_model
import json
from pong_project.models import MatchHistory

CustomUser = get_user_model()

@require_POST
def add_match(request):
    user = request.user
    if not user.is_authenticated:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    try:
        data = json.loads(request.body)

        required_fields = ['score_left', 'score_right', 'duration', 'match_type']
        if not all(field in data for field in required_fields):
            return JsonResponse({'error': 'Missing required fields'}, status=400)

        score_left = int(data['score_left'])
        score_right = int(data['score_right'])
        duration = int(data['duration'])
        match_type = data['match_type']

        if match_type not in dict(MatchHistory._meta.get_field('match_type').choices):
            return JsonResponse({'error': 'Invalid match_type'}, status=400)

        player_left = user
        player_right = None

        if match_type == 'online':
            if 'player_right' not in data:
                return JsonResponse({'error': 'Missing player_right for online match'}, status=400)
            try:
                player_right = CustomUser.objects.get(display_name=data['player_right'])
            except CustomUser.DoesNotExist:
                return JsonResponse({'error': 'player_right does not exist'}, status=404)

        match = MatchHistory.objects.create(
            player_left=player_left,
            player_right=player_right,
            score_left=score_left,
            score_right=score_right,
            duration=duration,
            match_type=match_type
        )

        # Update stats
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
            'message': 'Match recorded successfully',
            'match_id': match.id
        })

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except ValueError:
        return JsonResponse({'error': 'Invalid numeric values'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
