from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from ..models import FriendRequest
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

CustomUser = get_user_model()
channel_layer = get_channel_layer()

@login_required
def friends_request_send(request):
    """
    Sends a friend request from the authenticated user to another user.
    Expects a POST request with a JSON body containing 'display_name'.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        display_name = data.get('display_name')
        if not display_name:
            return JsonResponse({'error': 'display_name is required'}, status=400)

        to_user = CustomUser.objects.get(display_name=display_name)
        from_user = request.user

        if from_user == to_user:
            return JsonResponse({'error': 'Cannot send friend request to yourself'}, status=400)

        if to_user in from_user.friends.all():
            return JsonResponse({'error': 'User is already your friend'}, status=400)

        # Check if a request already exists
        if FriendRequest.objects.filter(from_user=from_user, to_user=to_user).exists():
            return JsonResponse({'error': 'Friend request already sent'}, status=400)

        FriendRequest.objects.create(from_user=from_user, to_user=to_user)

        async_to_sync(channel_layer.group_send)(
            f"user_{to_user.id}",
            {
                "type": "broadcast",
                "msg_type": "friend_request_new",
                "data": {
                    "display_name": from_user.display_name,
                    "profile_photo": from_user.profile_photo_url,
                }
            }
        )

        return JsonResponse({
            'message': f'Friend request sent to {display_name}',
            'display_name': to_user.display_name,
            'profile_photo': to_user.profile_photo_url,
        })
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': f'User {display_name} not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)