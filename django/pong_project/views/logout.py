from django.http import JsonResponse
from django.contrib.auth import logout as django_logout

def logout(request):
    django_logout(request)
    return JsonResponse({'message': 'Logout successful'})
