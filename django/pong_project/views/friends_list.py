from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from ..consumers import online_users

CustomUser = get_user_model()

@login_required
def friends_list(request):
    """ Returns a list of friends for the authenticated user. """
    try:
        user = request.user
        friends = user.friends.all()
        friends_data = [
            {
                'display_name': friend.display_name,
                'profile_photo': friend.profile_photo.url if friend.profile_photo else '',
                'is_online': friend.id in online_users,
                'last_online': None if friend.id in online_users else friend.last_online.isoformat(),
            }
            for friend in friends
        ]
        return JsonResponse({'friends': friends_data})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)