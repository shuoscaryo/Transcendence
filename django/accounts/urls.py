from django.urls import path
from . import views

urlpatterns = [
    path('', views.loginPost, name='login'),
]
