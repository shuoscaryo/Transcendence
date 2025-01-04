from django.shortcuts import render
import os
from django.http import FileResponse, Http404
from django.conf import settings

def index(request):
    return render(request, 'index.html')

def favicon(request):
    favicon_path = os.path.join(settings.BASE_DIR, 'static', 'favicon.ico')
    if os.path.exists(favicon_path):
        return FileResponse(open(favicon_path, 'rb'), content_type='image/x-icon')
    else:
        raise Http404("Favicon not found")