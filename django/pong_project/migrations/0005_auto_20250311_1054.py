# Generated by Django 3.2 on 2025-03-11 10:54

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('pong_project', '0004_customuser_friends'),
    ]

    operations = [
        migrations.AddField(
            model_name='matchhistory',
            name='match_type',
            field=models.CharField(choices=[('local', 'Local'), ('AI', 'AI'), ('online', 'online'), ('tournament', 'Tournament')], default='local', max_length=20),
        ),
        migrations.AlterField(
            model_name='matchhistory',
            name='playerRight',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='match_history_as_player_right', to=settings.AUTH_USER_MODEL),
        ),
    ]
