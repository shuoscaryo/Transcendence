from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.db.models import Q
from pong_project.models import MatchHistory

CustomUser = get_user_model()

def get_profile(username):
    try:
        user = CustomUser.objects.get(username=username)
        profile = {
            'username': user.username,
            'email': user.email,
            'wins': user.wins,
            'losses': user.losses,
            'profile_photo': user.profile_photo.url if user.profile_photo else '',
            'friends': list(user.friends.values_list('username', flat=True)),
            'date_joined': user.date_joined,
        }
        return JsonResponse(profile)
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_match_history(username, request):
    try:
        user = CustomUser.objects.get(username=username)
        
        # Parámetros de paginación
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 10))

        # Obtener historial de partidas
        matches = MatchHistory.objects.filter(
            Q(playerLeft=user) | Q(playerRight=user)
        ).order_by('-start_date').values(
            'id', 'playerLeft__username', 'playerRight__username',
            'scoreLeft', 'scoreRight', 'start_date', 'duration', 'matchType'
        )[offset:offset + limit]

        # Formatear fechas
        formatted_matches = []
        for match in matches:
            match['start_date'] = match['start_date'].strftime('%Y-%m-%d %H:%M:%S')
            formatted_matches.append(match)

        total_matches = MatchHistory.objects.filter(
            Q(playerLeft=user) | Q(playerRight=user)
        ).count()

        return JsonResponse({'matches': formatted_matches, 'total_matches': total_matches})
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    return get_profile(request.user.username)

def profile_by_username(request, username):
    return get_profile(username)

def match_history(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    return get_match_history(request.user.username, request)

def match_history_by_username(request, username):
    return get_match_history(username, request)