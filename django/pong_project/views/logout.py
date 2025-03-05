from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import logout as django_logout

@csrf_exempt
def logout(request):
    django_logout(request)
    return JsonResponse({'message': 'Logout successful'})
