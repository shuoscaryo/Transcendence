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
    Expects a POST request with a JSON body containing 'to_username'.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        to_username = data.get('to_username')
        if not to_username:
            return JsonResponse({'error': 'to_username is required'}, status=400)

        to_user = CustomUser.objects.get(username=to_username)
        from_user = request.user

        if from_user == to_user:
            return JsonResponse({'error': 'Cannot send friend request to yourself'}, status=400)

        if to_user in from_user.friends.all():
            return JsonResponse({'error': 'User is already your friend'}, status=400)

        # Check if a request already exists (all requests are implicitly pending)
        if FriendRequest.objects.filter(from_user=from_user, to_user=to_user).exists():
            return JsonResponse({'error': 'Friend request already sent'}, status=400)

        FriendRequest.objects.create(from_user=from_user, to_user=to_user)
        return JsonResponse({'message': f'Friend request sent to {to_username}'})
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': f'User {to_username} not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)