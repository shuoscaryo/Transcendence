from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# Create your views here.
@csrf_exempt
def login(request):
    if request.method == 'POST':
        import json
        data = json.loads(request.body)

        username = data.get('username')
        password = data.get('password')

        # Lógica simple de autenticación (usa django.contrib.auth en producción)
        if username == 'admin' and password == 'password':  # Ejemplo
            return JsonResponse({'message': 'Login successful'}, status=200)
        else:
            return JsonResponse({'message': 'Invalid credentials'}, status=401)

    return JsonResponse({'error': 'Method not allowed'}, status=405)
