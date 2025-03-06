from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    date_joined = models.DateTimeField(auto_now_add=True)
    #profile_photo = models.ImageField(upload_to='profile_photos/', default='profile_photos/default.jpg')

    