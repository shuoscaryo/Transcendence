# views/sendRequest.py
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from ..models import FriendRequest
import json

CustomUser = get_user_model()

@login_required
def friends_request_send(request):
    """
    Sends a friend request from the authenticated user to another user.
    Expects a POST request with a JSON body containing 'username'.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        username = data.get('username')
        if not username:
            return JsonResponse({'error': 'username is required'}, status=400)

        to_user = CustomUser.objects.get(username=username)
        from_user = request.user

        if from_user == to_user:
            return JsonResponse({'error': 'Cannot send friend request to yourself'}, status=400)

        if to_user in from_user.friends.all():
            return JsonResponse({'error': 'User is already your friend'}, status=400)

        # Check if a request already exists
        if FriendRequest.objects.filter(from_user=from_user, to_user=to_user).exists():
            return JsonResponse({'error': 'Friend request already sent'}, status=400)

        FriendRequest.objects.create(from_user=from_user, to_user=to_user)
        
        return JsonResponse({
            'message': f'Friend request sent to {username}',
            'username': to_user.username,
            'profile_photo': to_user.profile_photo.url
        })
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': f'User {username} not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)