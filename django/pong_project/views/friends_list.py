# views/friends.py
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
import redis
from django.conf import settings
from django.utils.timezone import now
from django.utils.timesince import timesince

CustomUser = get_user_model()
redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

@login_required
def friends_list(request):
    try:
        user = request.user
        friends = user.friends.all()
        current_time = now()

        friends_data = []
        for friend in friends:
            # Consultar estado en Redis
            status = redis_client.get(f"user_status:{friend.id}")
            is_online = status == "online"

            if is_online:
                last_online = "Now"
            elif friend.last_login:  # Fallback a last_login si no hay datos en Redis
                last_online = timesince(friend.last_login) + " ago"
            else:
                last_online = "Never"

            friends_data.append({
                'username': friend.username,
                'profile_photo': friend.profile_photo.url if friend.profile_photo else '',
                'is_online': is_online,
                'last_online': last_online
            })

        return JsonResponse({'friends': friends_data})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)