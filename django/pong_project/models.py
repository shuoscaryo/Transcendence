from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    profile_photo = models.ImageField(upload_to='profile_photos/', default='profile_photos/default.jpg')
    friends = models.ManyToManyField('self', blank=True)
    last_online = models.DateTimeField(default=timezone.now)

class MatchHistory(models.Model):
    playerLeft = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='match_history_as_player_left')
    playerRight = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='match_history_as_player_right', null=True)
    scoreLeft = models.IntegerField()
    scoreRight = models.IntegerField()
    start_date = models.DateTimeField(auto_now_add=True)
    duration = models.IntegerField()
    matchType = models.CharField(
        max_length=20,
        choices = [
            ('local','local'),
            ('AI', 'AI'),
            ('online','online'),
            ('tournament-local','tournament-local'),
            ('tournament-online', 'tournament-online'),
        ]
    )

class FriendRequest(models.Model):
    from_user = models.ForeignKey(CustomUser, related_name='friend_requests_sent', on_delete=models.CASCADE)
    to_user = models.ForeignKey(CustomUser, related_name='friend_requests_received', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f"{self.from_user.username} -> {self.to_user.username}"