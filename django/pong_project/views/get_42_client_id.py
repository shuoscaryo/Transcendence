from django.http import JsonResponse
import os

def get_42_client_id(request):
    client_id = os.environ.get("FORTY_TWO_CLIENT_ID")
    return JsonResponse({"client_id": client_id})