from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.APIlogin, name='login'),
    path('logout/', views.APIlogout, name='logout'),
    path('register/', views.APIregister, name='register'),
]
