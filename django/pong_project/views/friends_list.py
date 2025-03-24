# views/friends.py
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model

CustomUser = get_user_model()

@login_required
def friends_list(request):
    """ Returns a list of friends for the authenticated user. """
    try:
        user = request.user
        friends = user.friends.all()
        friends_data = [
            {
                'username': friend.username,
                'profile_photo': friend.profile_photo.url if friend.profile_photo else '',
                'is_online': getattr(friend, 'is_online', False)
            }
            for friend in friends
        ]
        return JsonResponse({'friends': friends_data})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)