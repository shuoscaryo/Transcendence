from django.http import JsonResponse
from django.contrib.auth.models import User

def userOther(request, username):
    user = User.objects.filter(username=username)
    if len(user) == 0:
        return JsonResponse({"error": "User not found"}, status=404)
    user = user[0]
    return JsonResponse({"username": user.username, "email": user.email, "date_joined": user.date_joined, "is_staff": user.is_staff, "is_superuser": user.is_superuser, "is_active": user.is_active})