"""
Sender email account models.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import EmailValidator
from apps.accounts.models import User
import uuid


class Sender(models.Model):
    """Email sender account."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='senders')
    
    email = models.EmailField(validators=[EmailValidator()])
    password = models.CharField(max_length=255)  # Encrypted
    display_name = models.CharField(max_length=100, blank=True, null=True)
    
    # SMTP settings
    smtp_host = models.CharField(max_length=255, default='smtp.gmail.com')
    smtp_port = models.IntegerField(default=587)
    smtp_use_tls = models.BooleanField(default=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    is_primary = models.BooleanField(default=False)
    
    # Quota
    daily_limit = models.IntegerField(default=400)
    sent_today = models.IntegerField(default=0)
    last_reset = models.DateField(auto_now_add=True)
    
    # Statistics
    total_sent = models.IntegerField(default=0)
    total_success = models.IntegerField(default=0)
    total_failed = models.IntegerField(default=0)
    last_used = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'senders'
        unique_together = [['user', 'email']]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.email} ({self.user.username})"
    
    def remaining_quota(self):
        """Calculate remaining daily quota."""
        from datetime import date
        if self.last_reset != date.today():
            self.sent_today = 0
            self.last_reset = date.today()
            self.save(update_fields=['sent_today', 'last_reset'])
        return max(0, self.daily_limit - self.sent_today)
    
    def increment_sent(self):
        """Increment sent count."""
        from datetime import date
        if self.last_reset != date.today():
            self.sent_today = 0
            self.last_reset = date.today()
        self.sent_today += 1
        self.total_sent += 1
        self.last_used = timezone.now()
        self.save()


class SenderGroup(models.Model):
    """Group multiple senders."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sender_groups')
    name = models.CharField(max_length=100)
    senders = models.ManyToManyField(Sender, related_name='groups')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'sender_groups'
        unique_together = [['user', 'name']]
    
    def __str__(self):
        return f"{self.name} ({self.user.username})"