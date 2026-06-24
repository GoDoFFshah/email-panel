"""
Email sending models.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import User
from apps.senders.models import Sender
import uuid


class EmailCampaign(models.Model):
    """Email campaign model."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='campaigns')
    
    name = models.CharField(max_length=200)
    subject = models.CharField(max_length=500)
    body = models.TextField()
    body_html = models.TextField(blank=True, null=True)
    
    STATUS_CHOICES = (
        ('draft', _('Draft')),
        ('scheduled', _('Scheduled')),
        ('sending', _('Sending')),
        ('completed', _('Completed')),
        ('failed', _('Failed')),
        ('paused', _('Paused')),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    PRIORITY_CHOICES = (
        ('smart', _('Smart Priority')),
        ('never_sent', _('Never Sent First')),
        ('oldest', _('Oldest First')),
        ('random', _('Random')),
        ('sequential', _('Sequential')),
    )
    priority_mode = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='smart')
    
    scheduled_for = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    total_recipients = models.IntegerField(default=0)
    sent_count = models.IntegerField(default=0)
    success_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    open_count = models.IntegerField(default=0)
    click_count = models.IntegerField(default=0)
    
    senders = models.ManyToManyField(Sender, related_name='campaigns')
    categories = models.JSONField(default=list, blank=True)
    recipients = models.JSONField(default=list, blank=True)
    pending_recipients = models.JSONField(default=list, blank=True)
    
    attachment = models.FileField(upload_to='attachments/%Y/%m/%d/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'email_campaigns'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.status}"
    
    def progress(self):
        if self.total_recipients == 0:
            return 0
        return int((self.sent_count / self.total_recipients) * 100)


class EmailSend(models.Model):
    """Individual email send record."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(EmailCampaign, on_delete=models.CASCADE, related_name='sends')
    sender = models.ForeignKey(Sender, on_delete=models.SET_NULL, null=True, related_name='sends')
    
    recipient_email = models.EmailField()
    recipient_name = models.CharField(max_length=200, blank=True, null=True)
    
    subject = models.CharField(max_length=500)
    body = models.TextField()
    
    STATUS_CHOICES = (
        ('pending', _('Pending')),
        ('sending', _('Sending')),
        ('sent', _('Sent')),
        ('delivered', _('Delivered')),
        ('opened', _('Opened')),
        ('clicked', _('Clicked')),
        ('bounced', _('Bounced')),
        ('failed', _('Failed')),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    error_message = models.TextField(blank=True, null=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    
    tracking_id = models.CharField(max_length=64, unique=True, blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'email_sends'
        ordering = ['-created_at']


class RecipientTracking(models.Model):
    """Track recipient history."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recipient_tracking')
    
    email = models.EmailField()
    name = models.CharField(max_length=200, blank=True, null=True)
    
    first_sent = models.DateTimeField(null=True, blank=True)
    last_sent = models.DateTimeField(null=True, blank=True)
    total_sent = models.IntegerField(default=0)
    
    total_opened = models.IntegerField(default=0)
    total_clicked = models.IntegerField(default=0)
    total_bounced = models.IntegerField(default=0)
    
    categories = models.JSONField(default=list, blank=True)
    
    is_active = models.BooleanField(default=True)
    is_subscribed = models.BooleanField(default=True)
    is_bounced = models.BooleanField(default=False)
    
    source = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'recipient_tracking'
        unique_together = [['user', 'email']]
    
    def __str__(self):
        return f"{self.email} - Sent: {self.total_sent}"
    
    def get_priority_score(self):
        """Calculate priority score."""
        from datetime import datetime
        if self.total_sent == 0:
            return 0
        if self.last_sent:
            days_ago = (datetime.now() - self.last_sent).days
            return days_ago + 1
        return 999999