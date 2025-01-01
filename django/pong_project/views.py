from django.shortcuts import render
import os
from django.http import FileResponse, Http404
from django.conf import settings

def index(request):
    return render(request, 'index.html')
