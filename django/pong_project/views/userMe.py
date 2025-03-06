from django.http import JsonResponse
from ..models import CustomUser

def userMe(request):
    if request.user.is_authenticated:
        user = request.user
        return JsonResponse({
            'username': user.username,
            'email': user.email,
            'wins': user.wins,
            'losses': user.losses
        })
    return JsonResponse({'error': 'Not authenticated'}, status=401)