# views/cancelRequest.py
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from ..models import FriendRequest
import json

CustomUser = get_user_model()

@login_required
def friends_request_cancel(request):
    """
    Cancels a friend request sent by the authenticated user.
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

        # Look for the friend request (all requests are implicitly pending)
        friend_request = FriendRequest.objects.filter(
            from_user=from_user,
            to_user=to_user
        ).first()

        if not friend_request:
            return JsonResponse({'error': 'No friend request found'}, status=404)

        friend_request.delete()
        return JsonResponse({'message': f'Friend request to {to_username} canceled'})
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': f'User {to_username} not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)