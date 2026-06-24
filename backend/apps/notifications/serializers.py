from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """سریالایزر اعلان‌ها"""
    
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type',
            'is_read', 'read_at', 'link', 'icon',
            'created_at', 'updated_at', 'time_ago'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at)