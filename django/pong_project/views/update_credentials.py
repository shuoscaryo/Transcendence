from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
import re

@csrf_exempt
def update_credentials(request, credential):
    if request.method != 'POST' or not request.user.is_authenticated:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    user = request.user

    if credential == 'profile_photo':
        if 'profile_photo' not in request.FILES:
            return JsonResponse({'error': 'No image uploaded'}, status=400)
        user.profile_photo = request.FILES['profile_photo']
        user.save()
        return JsonResponse({credential: user.profile_photo.url})

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    value = data.get('value')
    password = data.get('password')

    if not value:
        return JsonResponse({'error': 'Missing value'}, status=400)
    if not password:
        return JsonResponse({'error': 'Password is required'}, status=400)
    if not user.check_password(password):
        return JsonResponse({'error': 'Incorrect password'}, status=403)

    # --- Username ---
    if credential == 'username':
        if not re.fullmatch(r'[a-zA-Z0-9_]{3,20}', value):
            return JsonResponse({'error': 'Invalid username format'}, status=400)
        if value == user.username:
            return JsonResponse({'error': 'Username is the same as current'}, status=400)
        user.username = value

    # --- Email ---
    elif credential == 'email':
        if not re.fullmatch(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', value):
            return JsonResponse({'error': 'Invalid email format'}, status=400)
        if value == user.email:
            return JsonResponse({'error': 'Email is the same as current'}, status=400)
        user.email = value

    # --- Display name ---
    elif credential == 'display_name':
        if not re.fullmatch(r'[a-zA-Z0-9_]{3,20}', value):
            return JsonResponse({'error': 'Invalid display name format'}, status=400)
        if value == user.display_name:
            return JsonResponse({'error': 'Display name is the same as current'}, status=400)
        user.display_name = value

    # --- Password ---
    elif credential == 'password':
        if len(value) < 8 \
            or not re.search(r'[A-Z]', value) \
            or not re.search(r'[a-z]', value) \
            or not re.search(r'[^a-zA-Z0-9]', value):
            return JsonResponse({'error': 'Password must be at least 8 characters and include upper, lower and special characters'}, status=400)
        user.set_password(value)

    else:
        return JsonResponse({'error': 'Invalid credential type'}, status=400)

    user.save()
    if credential == 'password':
        return JsonResponse()
    return JsonResponse({credential: value})
