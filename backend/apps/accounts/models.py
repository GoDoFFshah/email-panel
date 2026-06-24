"""
User account models with enhanced fields.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinLengthValidator
import uuid


class User(AbstractUser):
    """Custom user model."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    USER_TYPES = (
        ('user', _('Regular User')),
        ('admin', _('Admin')),
        ('super_admin', _('Super Admin')),
    )
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='user')
    
    ACCOUNT_STATUS = (
        ('active', _('Active')),
        ('suspended', _('Suspended')),
        ('banned', _('Banned')),
        ('pending', _('Pending Approval')),
    )
    account_status = models.CharField(max_length=20, choices=ACCOUNT_STATUS, default='pending')
    
    email_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=100, blank=True, null=True)
    
    # Quota
    daily_quota = models.IntegerField(default=400)
    max_senders = models.IntegerField(default=10)
    max_categories = models.IntegerField(default=50)
    
    # Security
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_login_user_agent = models.TextField(blank=True, null=True)
    login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    # Statistics
    total_sent = models.IntegerField(default=0)
    total_success = models.IntegerField(default=0)
    total_failed = models.IntegerField(default=0)
    joined_date = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    # Preferences
    language = models.CharField(max_length=10, default='fa', choices=(
        ('fa', _('Persian')),
        ('en', _('English')),
    ))
    theme = models.CharField(max_length=20, default='dark', choices=(
        ('dark', _('Dark')),
        ('light', _('Light')),
    ))
    
    # Suspicious
    is_suspicious = models.BooleanField(default=False)
    suspicious_reason = models.TextField(blank=True, null=True)
    flagged_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.username} ({self.email})"
    
    def get_full_name(self):
        if self.first_name or self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        return self.username
    
    def is_active_user(self):
        return self.account_status == 'active' and self.is_active
    
    def can_send_email(self):
        if self.account_status != 'active':
            return False, _('Account is not active')
        if self.locked_until and self.locked_until > timezone.now():
            return False, _('Account is locked')
        return True, _('OK')


class UserActivityLog(models.Model):
    """Log user activities."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    action = models.CharField(max_length=100)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_activity_logs'
        ordering = ['-timestamp']


class UserLoginHistory(models.Model):
    """Track user login history."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    location = models.CharField(max_length=200, blank=True, null=True)
    status = models.CharField(max_length=20, choices=(
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('blocked', 'Blocked'),
    ))
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_login_history'
        ordering = ['-timestamp']


class EmailVerification(models.Model):
    """Model for email verification and password reset."""
    
    VERIFICATION_TYPES = (
        ('register', 'ثبت‌نام'),
        ('reset_password', 'بازیابی رمز عبور'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verifications', null=True, blank=True)
    email = models.EmailField()
    code = models.CharField(max_length=6)  # 6-digit code
    token = models.CharField(max_length=100, blank=True, null=True)  # Token for reset password
    verification_type = models.CharField(max_length=20, choices=VERIFICATION_TYPES, default='register')
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'email_verifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'code']),
            models.Index(fields=['verification_type', 'is_used']),
        ]
    
    def is_expired(self):
        """Check if verification code is expired."""
        return timezone.now() > self.expires_at
    
    def __str__(self):
        return f"{self.email} - {self.verification_type} - {self.code}"