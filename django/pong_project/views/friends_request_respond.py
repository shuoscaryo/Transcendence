from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from ..models import FriendRequest
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from ..consumers import online_users

CustomUser = get_user_model()
channel_layer = get_channel_layer()

@login_required
def friends_request_respond(request):
    """
    Handles accepting or rejecting a friend request received by the authenticated user.
    Expects a POST request with JSON body containing 'display_name' and 'action' ('accept' or 'reject').
    Deletes the friend request after processing.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        display_name = data.get('display_name')
        action = data.get('action')

        if not display_name or not action:
            return JsonResponse({'error': 'display_name and action are required'}, status=400)

        if action not in ['accept', 'decline']:
            return JsonResponse({'error': 'Invalid action'}, status=400)

        from_user = CustomUser.objects.get(display_name=display_name)
        to_user = request.user

        friend_request = FriendRequest.objects.filter(
            from_user=from_user,
            to_user=to_user
        ).first()

        if not friend_request:
            return JsonResponse({'error': 'No pending friend request found'}, status=404)
        
        async_to_sync(channel_layer.group_send)(
            f"user_{from_user.id}",
            {
                "type": "normal_send",
                "msg_type": "friend_request_response",
                "answer": action,
                "profile_photo": to_user.profile_photo.url,
                "display_name": to_user.display_name,
                "is_online": to_user.id in online_users,
                "last_online": None if to_user.id in online_users else to_user.last_online,
            }
        )
        friend_request.delete()
        if action == 'accept':
            from_user.friends.add(to_user)
            to_user.friends.add(from_user)
            return JsonResponse({
                "profile_photo": from_user.profile_photo.url,
                "display_name": from_user.display_name,
                "is_online": from_user.id in online_users,
                "last_online": None if from_user.id in online_users else from_user.last_online,
            })
        else:
            return JsonResponse({'message': f'Friend request from {display_name} rejected'})
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': f'User {display_name} not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)