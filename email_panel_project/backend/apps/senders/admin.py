"""
Django admin for senders.
"""

from django.contrib import admin
from .models import Sender, SenderGroup


@admin.register(Sender)
class SenderAdmin(admin.ModelAdmin):
    """Sender admin."""
    
    list_display = ['email', 'user', 'is_active', 'is_verified', 'is_primary', 'sent_today', 'daily_limit']
    list_filter = ['is_active', 'is_verified', 'is_primary']
    search_fields = ['email', 'user__username']


@admin.register(SenderGroup)
class SenderGroupAdmin(admin.ModelAdmin):
    """Sender group admin."""
    
    list_display = ['name', 'user', 'is_active', 'created_at']
    filter_horizontal = ['senders']