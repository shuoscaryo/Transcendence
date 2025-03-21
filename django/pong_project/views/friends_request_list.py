# views/getRequestList.py
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from ..models import FriendRequest

CustomUser = get_user_model()

@login_required
def friends_request_list(request):
    """
    Returns the friend requests sent and received by the authenticated user.
    All requests in the database are implicitly pending.
    """
    try:
        user = request.user

        # Fetch sent requests (friend_requests_sent)
        # No need to filter by status since all requests are pending
        sent_requests = user.friend_requests_sent.all()
        sent_data = [
            {
                'to_username': req.to_user.username,
                'created_at': req.created_at.isoformat()
                # Removed 'status' from the response
            }
            for req in sent_requests
        ]

        # Fetch received requests (friend_requests_received)
        # No need to filter by status since all requests are pending
        received_requests = user.friend_requests_received.all()
        received_data = [
            {
                'from_username': req.from_user.username,
                'created_at': req.created_at.isoformat()
                # Removed 'status' from the response
            }
            for req in received_requests
        ]

        return JsonResponse({
            'sent': sent_data,
            'received': received_data
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)