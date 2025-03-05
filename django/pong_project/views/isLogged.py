from django.http import JsonResponse

def isLogged(request):
    if request.user.is_authenticated:
        return JsonResponse({'isLogged': True})
    else:
        return JsonResponse({'isLogged': False})
