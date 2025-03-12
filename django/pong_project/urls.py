"""
URL configuration for pong_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, re_path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('favicon.ico', views.favicon, name='favicon'),
    path('api/is-logged', views.isLogged),
    path('api/login', views.login),
    path('api/register', views.register),
    path('api/logout', views.logout),
    path('api/profile/', views.profile),
    path('api/profile/<str:username>', views.profile_by_username),
    path('api/add-match', views.add_match),
	path('api/tournaments', views.tournaments),
	path('', views.index),
	re_path(r'^(?!api/).*$', views.index),
]
