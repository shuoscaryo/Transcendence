from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import logout

@csrf_exempt
def APIlogout(request):
    logout(request)
    return JsonResponse({'message': 'Logout succesful'})
