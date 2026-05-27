from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ('attendee', 'Attendee'),
        ('organizer', 'Event Organizer'),
        ('admin', 'Administrator'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='attendee')
    phone = models.CharField(max_length=15, blank=True)
    organization_name = models.CharField(max_length=150, blank=True)
    
    def __str__(self):
        return f"{self.username} ({self.role})"


class APIToken(models.Model):
    TOKEN_TYPE_CHOICES = (
        ('access', 'Access'),
        ('refresh', 'Refresh'),
    )

    user = models.ForeignKey(User, related_name='api_tokens', on_delete=models.CASCADE)
    token_hash = models.CharField(max_length=64, unique=True)
    token_type = models.CharField(max_length=10, choices=TOKEN_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['token_hash', 'token_type']),
            models.Index(fields=['user', 'token_type']),
        ]

    @property
    def is_active(self):
        return self.revoked_at is None and self.expires_at > timezone.now()
