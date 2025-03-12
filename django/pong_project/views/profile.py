from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.db.models import Q

CustomUser = get_user_model()
from pong_project.models import MatchHistory

def get_profile_data(username, request):
    """Subfunción para obtener datos del perfil y partidas de un usuario."""
    try:
        user = CustomUser.objects.get(username=username)
        # Obtener datos del perfil
        profile = {
            'username': user.username,
            'email': user.email,
            'wins': user.wins,
            'losses': user.losses,
            'profile_photo': user.profile_photo.url if user.profile_photo else '',
            'friends': list(user.friends.values_list('username', flat=True)),
            'date_joined': user.date_joined.strftime('%Y-%m-%d')
        }
        # Obtener parámetros de paginación
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 10))
        # Obtener historial de partidas (como playerLeft o playerRight)
        matches = MatchHistory.objects.filter(
            Q(playerLeft=user) | Q(playerRight=user)
        ).order_by('-start_date').values(
            'id', 'playerLeft__username', 'playerRight__username',
            'scoreLeft', 'scoreRight', 'start_date', 'duration', 'match_type'
        )[offset:offset + limit]

        formatted_matches = []
        for match in matches:
            match['start_date'] = match['start_date'].strftime('%Y-%m-%d %H:%M:%S')  # Sin "T", sin milisegundos
            formatted_matches.append(match)

        # Contar total de partidas para saber si hay más
        total_matches = MatchHistory.objects.filter(
            Q(playerLeft=user) | Q(playerRight=user)
        ).count()
        return JsonResponse({
            'profile': profile,
            'match_history': list(matches),
            'total_matches': total_matches
        })
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def profile(request):
    """Ruta /api/profile/ - Perfil del usuario autenticado."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    return get_profile_data(request.user.username, request)

def profile_by_username(request, username):
    """Ruta /api/profile/algo - Perfil público de un usuario por username."""
    return get_profile_data(username, request)