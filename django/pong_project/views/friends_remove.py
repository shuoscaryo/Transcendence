# views/removeFriend.py
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
import json

CustomUser = get_user_model()

@login_required
def friends_remove(request):
    """
    Removes a friend from the authenticated user's friends list.
    Expects a POST request with a JSON body containing 'friend_username'.
    """
    # Ensure the request method is POST
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        # Parse the request body to get the friend's username
        data = json.loads(request.body)
        friend_username = data.get('friend_username')
        if not friend_username:
            return JsonResponse({'error': 'friend_username is required'}, status=400)

        # Find the friend to remove
        friend = CustomUser.objects.get(username=friend_username)
        user = request.user

        # Check if the users are actually friends
        if friend not in user.friends.all():
            return JsonResponse({'error': f'{friend_username} is not in your friends list'}, status=400)

        # Remove the friend from both users' friends lists (symmetric relationship)
        user.friends.remove(friend)
        friend.friends.remove(user)

        return JsonResponse({'message': f'{friend_username} has been removed from your friends list'})
    except CustomUser.DoesNotExist:
        # Handle case where the friend user does not exist
        return JsonResponse({'error': f'User {friend_username} not found'}, status=404)
    except Exception as e:
        # Handle any other unexpected errors
        return JsonResponse({'error': str(e)}, status=500)