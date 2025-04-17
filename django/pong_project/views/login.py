from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
import json

def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        username = data.get('username')
        password = data.get('password')
        if not username or not password:
            return JsonResponse({'error': 'Username and password are required'}, status=400)
        user = authenticate(request, username=username, password=password)
        if user is not None:
            django_login(request, user)
            return JsonResponse({'message': 'succesful login'})
        else:
            return JsonResponse({'error': 'invalid credentials'}, status=401)

    return JsonResponse({'error': 'Method not allowed'}, status=405)
