from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.db.models import Q
from pong_project.models import MatchHistory

CustomUser = get_user_model()

def get_match_history(display_name, request):
    try:
        user = CustomUser.objects.get(display_name=display_name)
        
        # Params
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 10))

        # Get the matches range
        matches = MatchHistory.objects.filter(
            Q(playerLeft=user) | Q(playerRight=user)
        ).order_by('-start_date').values(
            'id', 'playerLeft__display_name', 'playerRight__display_name',
            'scoreLeft', 'scoreRight', 'start_date', 'duration', 'matchType'
        )[offset:offset + limit]

        # Format dates so it doesn't crash the JSON serializer
        formatted_matches = []
        for match in matches:
            match['start_date'] = match['start_date'].isoformat()
            formatted_matches.append(match)

        # Get total matches
        total_matches = MatchHistory.objects.filter(
            Q(playerLeft=user) | Q(playerRight=user)
        ).count()

        return JsonResponse({'matches': formatted_matches, 'total_matches': total_matches})
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def match_history(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    return get_match_history(request.user.display_name, request)

def match_history_by_display_name(request, display_name):
    return get_match_history(display_name, request)