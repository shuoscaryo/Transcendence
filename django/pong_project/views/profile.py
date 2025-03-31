from django.http import JsonResponse
from django.contrib.auth import get_user_model

CustomUser = get_user_model()

def get_profile(display_name, own_profile=False):
    try:
        user = CustomUser.objects.get(display_name=display_name)
        # Start with general data for everyone
        output_data = {
            'display_name': user.display_name,
            'profile_photo': user.profile_photo_url,
            'date_joined': user.date_joined,
        }
        # Specific data for own profile
        if own_profile:
            own_profile_data = {
                "username": user.username,
                "email": user.email,
                "friends": [friend.display_name for friend in user.friends.all()],
            }
            output_data.update(own_profile_data)

        return JsonResponse(output_data)
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    return get_profile(request.user.display_name, own_profile = True)

def profile_by_display_name(request, display_name):
    return get_profile(display_name, own_profile = False)
