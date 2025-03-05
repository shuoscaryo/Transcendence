from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
import json

@csrf_exempt
def login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        username = data.get('username')
        password = data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            django_login(request, user)
            return JsonResponse({'message': 'succesful login'})
        else:
            return JsonResponse({'error': 'invalid credentials'}, status=401)

    return JsonResponse({'error': 'Method not allowed'}, status=405)
