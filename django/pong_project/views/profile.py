from django.http import JsonResponse
from django.contrib.auth import get_user_model

CustomUser = get_user_model()

def get_profile(display_name, authenticated=False):
    try:
        user = CustomUser.objects.get(display_name=display_name)
        profile = {
            'display_name': user.display_name,
            'email': user.email if authenticated else None,
            'wins': user.wins,
            'losses': user.losses,
            'profile_photo': user.profile_photo.url if user.profile_photo else '',
            'friends': list(user.friends.values_list('display_name', flat=True)),
            'date_joined': user.date_joined,
        }
        return JsonResponse(profile)
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    return get_profile(request.user.display_name, authenticated = True)

def profile_by_display_name(request, display_name):
    return get_profile(display_name, authenticated = False)
