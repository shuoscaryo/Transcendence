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
def friends_request_cancel(request):
    """
    Cancels a friend request sent by the authenticated user.
    Expects a POST request with a JSON body containing 'display_name'.
    """
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        display_name = data.get('display_name')
        if not display_name:
            return JsonResponse({'error': 'display_name is required'}, status=400)

        to_user = CustomUser.objects.get(display_name=display_name)
        from_user = request.user

        # Look for the friend request (all requests are implicitly pending)
        friend_request = FriendRequest.objects.filter(
            from_user=from_user,
            to_user=to_user
        ).first()

        if not friend_request:
            return JsonResponse({'error': 'No friend request found'}, status=404)

        friend_request.delete()
        async_to_sync(channel_layer.group_send)(
            f"user_{to_user.id}",
            {
                "type": "normal_send",
                "msg_type": "friend_request_cancelled",
                "display_name": from_user.display_name,
            }
        )
        return JsonResponse({'message': f'Friend request to {display_name} canceled'})
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': f'User {display_name} not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)