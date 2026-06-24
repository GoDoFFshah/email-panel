"""
Django admin configuration for accounts.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserActivityLog, UserLoginHistory


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom user admin."""
    
    list_display = ['username', 'email', 'user_type', 'account_status', 'is_active', 'joined_date']
    list_filter = ['user_type', 'account_status', 'is_active', 'joined_date']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-joined_date']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {
            'fields': ('user_type', 'account_status', 'daily_quota', 'max_senders', 'max_categories')
        }),
        ('Statistics', {
            'fields': ('total_sent', 'total_success', 'total_failed'),
        }),
        ('Security', {
            'fields': ('is_suspicious', 'suspicious_reason', 'flagged_at'),
        }),
    )


@admin.register(UserActivityLog)
class UserActivityLogAdmin(admin.ModelAdmin):
    """User activity log admin."""
    
    list_display = ['user', 'action', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['user__username', 'action']
    ordering = ['-timestamp']


@admin.register(UserLoginHistory)
class UserLoginHistoryAdmin(admin.ModelAdmin):
    """User login history admin."""
    
    list_display = ['user', 'ip_address', 'status', 'timestamp']
    list_filter = ['status', 'timestamp']
    search_fields = ['user__username', 'ip_address']
    ordering = ['-timestamp']