from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    profile_photo = models.ImageField(upload_to='profile_photos/', default='profile_photos/default.jpg')
    friends = models.ManyToManyField('self', blank=True)

class MatchHistory(models.Model):
    playerLeft = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='match_history_as_player_left')
    playerRight = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='match_history_as_player_right', null=True)
    scoreLeft = models.IntegerField()
    scoreRight = models.IntegerField()
    start_date = models.DateTimeField(auto_now_add=True)
    duration = models.IntegerField()
    matchType = models.CharField(max_length=20, choices=[('local','Local'), ('AI', 'AI'), ('online','online'), ('tournament','Tournament')], default='local')