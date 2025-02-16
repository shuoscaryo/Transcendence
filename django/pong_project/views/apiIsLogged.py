from django.http import JsonResponse

def apiIsLogged(request):
    if request.user.is_authenticated:
        return JsonResponse({'authenticated': True})
    else:
        return JsonResponse({'authenticated': False}, status=401)