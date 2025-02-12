from django.shortcuts import render
    
def index(request, extra=None):
    return render(request, 'index.html')