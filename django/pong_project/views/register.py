from django.http import JsonResponse
from django.contrib.auth import get_user_model, login as django_login
import json

CustomUser = get_user_model()

def register(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        username = data.get('username')
        password = data.get('password')
        display_name = data.get('display_name')

        if not username or not password or not display_name:
            return JsonResponse({'error': 'Username, display_name and password are required'}, status=400)

        if CustomUser.objects.filter(display_name=display_name).exists():
            return JsonResponse({'error': 'Display name taken'}, status=409)

        if CustomUser.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username taken'}, status=409)
        
        try:
            user = CustomUser.objects.create_user(username=username, password=password, display_name=display_name)
            django_login(request, user)
            request.session.save()
            return JsonResponse({'message': 'User registered successfully'}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)