"""
Sender serializers.
"""

from rest_framework import serializers
from django.core.validators import EmailValidator
from .models import Sender, SenderGroup


class SenderSerializer(serializers.ModelSerializer):
    """Sender serializer."""
    
    password = serializers.CharField(write_only=True, required=False)
    remaining_quota = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Sender
        fields = [
            'id', 'email', 'password', 'display_name',
            'smtp_host', 'smtp_port', 'smtp_use_tls',
            'is_active', 'is_verified', 'is_primary',
            'daily_limit', 'sent_today', 'remaining_quota',
            'total_sent', 'total_success', 'total_failed',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'total_sent', 'total_success', 'total_failed']
    
    def create(self, validated_data):
        # رمز رو بدون رمزنگاری ذخیره کن
        password = validated_data.pop('password', None)
        sender = Sender.objects.create(**validated_data)
        if password:
            sender.password = password
            sender.save()
        return sender
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.password = password
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class SenderGroupSerializer(serializers.ModelSerializer):
    """Sender group serializer."""
    
    sender_count = serializers.IntegerField(source='senders.count', read_only=True)
    
    class Meta:
        model = SenderGroup
        fields = ['id', 'name', 'senders', 'sender_count', 'is_active', 'created_at']