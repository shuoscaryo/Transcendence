from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import os
import uuid
from django.utils.deconstruct import deconstructible
from django.conf import settings

@deconstructible
class PathAndRename:
    def __init__(self, path):
        self.path = path

    def __call__(self, instance, filename):
        ext = filename.split('.')[-1]
        filename = f"{uuid.uuid4().hex}.{ext}"
        return os.path.join(self.path, filename)

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=30, unique=True)
    profile_photo = models.ImageField(upload_to=PathAndRename('profile_photos/'), blank=True, null=True)
    @property
    def profile_photo_url(self):
        if self.profile_photo:
            return self.profile_photo.url
        return f'{settings.MEDIA_URL}profile_photos/default.jpg'
    friends = models.ManyToManyField('self', blank=True)
    last_online = models.DateTimeField(default=timezone.now)
    forty_two_id = models.IntegerField(unique=True, null=True, blank=True)



class MatchHistory(models.Model):
    player_left = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='match_history_as_player_left')
    player_right = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='match_history_as_player_right', null=True)
    score_left = models.IntegerField()
    score_right = models.IntegerField()
    start_date = models.DateTimeField()
    duration = models.IntegerField() # in seconds
    match_type = models.CharField(
        max_length=20,
        choices = [
            ('local','local'),
            ('AI', 'AI'),
            ('online','online'),
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