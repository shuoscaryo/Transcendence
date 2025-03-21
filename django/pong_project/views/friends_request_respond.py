# views/answerRequest.py
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from ..models import FriendRequest
import json

CustomUser = get_user_model()

@login_required
def friends_request_respond(request):
    """
    Handles accepting or rejecting a friend request received by the authenticated user.
    Expects a POST request with JSON body containing 'from_username' and 'action' ('accept' or 'reject').
    Deletes the friend request after processing.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        from_username = data.get('from_username')
        action = data.get('action')

        if not from_username or not action:
            return JsonResponse({'error': 'from_username and action are required'}, status=400)

        if action not in ['accept', 'reject']:
            return JsonResponse({'error': 'Invalid action'}, status=400)

        from_user = CustomUser.objects.get(username=from_username)
        to_user = request.user

        friend_request = FriendRequest.objects.filter(
            from_user=from_user,
            to_user=to_user
        ).first()

        if not friend_request:
            return JsonResponse({'error': 'No pending friend request found'}, status=404)

        if action == 'accept':
            from_user.friends.add(to_user)
            to_user.friends.add(from_user)
            friend_request.delete()
            return JsonResponse({'message': f'Friend request from {from_username} accepted'})
        else:
            friend_request.delete()
            return JsonResponse({'message': f'Friend request from {from_username} rejected'})
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': f'User {from_username} not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)