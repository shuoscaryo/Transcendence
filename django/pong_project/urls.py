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
    path('api/profile', views.profile),
    path('api/profile/<str:display_name>', views.profile_by_display_name),
    path('api/match-history', views.match_history),
    path('api/match-history/<str:display_name>', views.match_history_by_display_name),
    path('api/add-match', views.add_match),
	path('api/tournaments', views.tournaments),
    path('api/friends/list', views.friends_list),
    path('api/friends/remove', views.friends_remove),
    path('api/friends/request/cancel', views.friends_request_cancel),
    path('api/friends/request/list', views.friends_request_list),
    path('api/friends/request/respond', views.friends_request_respond),
    path('api/friends/request/send', views.friends_request_send),
	path('', views.index),
	re_path(r'^(?!api/).*$', views.index),
]
