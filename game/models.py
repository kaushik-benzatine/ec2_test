from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=60, blank=True, default='')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    avatar_preset = models.CharField(max_length=50, default='bot_1', blank=True)
    points = models.IntegerField(default=0)  # Total lifetime score
    daily_points = models.IntegerField(default=0)  # Current day's score
    clicks_given = models.IntegerField(default=0)
    clicks_received = models.IntegerField(default=0)
    last_active_date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.effective_display_name}) - {self.daily_points} pts"

    @property
    def effective_display_name(self):
        if self.display_name and self.display_name.strip():
            return self.display_name.strip()
        return self.user.username

    @property
    def avatar_url(self):
        if self.avatar:
            try:
                return self.avatar.url
            except Exception:
                pass
        # Fallback to SVG/Preset avatar url
        return f"/static/avatars/{self.avatar_preset}.svg"

    def check_and_reset_daily(self):
        """Auto resets daily score if date changed without rollover"""
        today = timezone.localdate()
        if self.last_active_date < today:
            self.daily_points = 0
            self.last_active_date = today
            self.save(update_fields=['daily_points', 'last_active_date'])


class DailyRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_history')
    date = models.DateField(default=timezone.localdate, db_index=True)
    points = models.IntegerField(default=0)
    rank = models.IntegerField(default=1)
    clicks_given = models.IntegerField(default=0)
    clicks_received = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', 'rank']
        unique_together = ('user', 'date')

    def __str__(self):
        return f"[{self.date}] Rank {self.rank}: {self.user.username} ({self.points} pts)"


class ClickEvent(models.Model):
    clicker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='clicks_made')
    target = models.ForeignKey(User, on_delete=models.CASCADE, related_name='clicks_received_events')
    points = models.IntegerField(default=10)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.clicker.username} clicked {self.target.username} (+{self.points} pts) at {self.timestamp}"


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance, display_name=instance.username)
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()
