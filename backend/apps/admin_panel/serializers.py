"""
Admin panel serializers.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.accounts.models import UserActivityLog, UserLoginHistory
from apps.senders.models import Sender
from apps.emails.models import EmailCampaign, EmailSend

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    """Admin user serializer with statistics."""
    
    total_sends = serializers.IntegerField(read_only=True)
    success_sends = serializers.IntegerField(read_only=True)
    sender_count = serializers.IntegerField(read_only=True)
    campaign_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'user_type', 'account_status', 'language', 'theme',
            'daily_quota', 'total_sent', 'total_success', 'total_failed',
            'is_suspicious', 'suspicious_reason', 'flagged_at',
            'joined_date', 'last_activity', 'last_login_ip',
            'total_sends', 'success_sends', 'sender_count', 'campaign_count'
        ]
        read_only_fields = ['id', 'joined_date', 'last_activity']


class SystemStatsSerializer(serializers.Serializer):
    """System statistics serializer."""
    
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    banned_users = serializers.IntegerField()
    new_users_week = serializers.IntegerField()
    
    total_campaigns = serializers.IntegerField()
    total_sends = serializers.IntegerField()
    success_rate = serializers.FloatField()
    
    total_senders = serializers.IntegerField()
    active_senders = serializers.IntegerField()
    
    total_categories = serializers.IntegerField()
    total_emails = serializers.IntegerField()
    
    suspicious_users = serializers.IntegerField()
    failed_logins_today = serializers.IntegerField()


class ActivityLogSerializer(serializers.ModelSerializer):
    """Activity log serializer."""
    
    username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = UserActivityLog
        fields = [
            'id', 'username', 'user_email', 'action',
            'details', 'ip_address', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class UserLoginHistorySerializer(serializers.ModelSerializer):
    """User login history serializer."""
    
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserLoginHistory
        fields = [
            'id', 'username', 'ip_address', 'location',
            'status', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class SecurityReportSerializer(serializers.Serializer):
    """Security report serializer."""
    
    period_start = serializers.DateTimeField()
    period_end = serializers.DateTimeField()
    failed_logins = serializers.IntegerField()
    blocked_ips = serializers.ListField()
    suspicious_users = serializers.ListField()
    total_activities = serializers.IntegerField()
    generated_at = serializers.DateTimeField()