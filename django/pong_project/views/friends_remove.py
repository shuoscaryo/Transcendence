from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

CustomUser = get_user_model()
channel_layer = get_channel_layer()

@login_required
def friends_remove(request):
    """
    Removes a friend from the authenticated user's friends list.
    Expects a POST request with a JSON body containing 'display_name'.
    """
    # Ensure the request method is POST
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        # Parse the request body to get the friend's display_name
        data = json.loads(request.body)
        display_name = data.get('display_name')
        if not display_name:
            return JsonResponse({'error': 'display_name is required'}, status=400)

        # Find the friend to remove
        friend = CustomUser.objects.get(display_name=display_name)
        user = request.user

        # Check if the users are actually friends
        if friend not in user.friends.all():
            return JsonResponse({'error': f'{display_name} is not in your friends list'}, status=400)

        # Remove the friend from both users' friends lists (symmetric relationship)
        user.friends.remove(friend)
        friend.friends.remove(user)

        async_to_sync(channel_layer.group_send)(
            f"user_{friend.id}",
            {
                "type": "broadcast",
                "msg_type": "friend_removed",
                "data": {
                    "display_name": user.display_name,
                }
            }
        )
        return JsonResponse({'message': f'{display_name} has been removed from your friends list'})
    except CustomUser.DoesNotExist:
        # Handle case where the friend user does not exist
        return JsonResponse({'error': f'User {display_name} not found'}, status=404)
    except Exception as e:
        # Handle any other unexpected errors
        return JsonResponse({'error': str(e)}, status=500)