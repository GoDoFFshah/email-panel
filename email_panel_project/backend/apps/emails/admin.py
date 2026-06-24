"""
Django admin for emails.
"""

from django.contrib import admin
from .models import EmailCampaign, EmailSend, RecipientTracking


@admin.register(EmailCampaign)
class EmailCampaignAdmin(admin.ModelAdmin):
    """Email campaign admin."""
    
    list_display = ['name', 'user', 'status', 'total_recipients', 'progress', 'created_at']
    list_filter = ['status', 'priority_mode', 'created_at']
    search_fields = ['name', 'subject', 'user__username']
    filter_horizontal = ['senders']


@admin.register(EmailSend)
class EmailSendAdmin(admin.ModelAdmin):
    """Email send admin."""
    
    list_display = ['recipient_email', 'campaign', 'sender', 'status', 'sent_at']
    list_filter = ['status', 'sent_at']
    search_fields = ['recipient_email', 'campaign__name']


@admin.register(RecipientTracking)
class RecipientTrackingAdmin(admin.ModelAdmin):
    """Recipient tracking admin."""
    
    list_display = ['email', 'user', 'total_sent', 'is_active', 'is_subscribed', 'last_sent']
    list_filter = ['is_active', 'is_subscribed', 'is_bounced']
    search_fields = ['email', 'name']