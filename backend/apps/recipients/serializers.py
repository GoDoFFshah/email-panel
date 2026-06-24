"""
Recipient serializers.
"""

from rest_framework import serializers
from .models import Recipient


class RecipientSerializer(serializers.ModelSerializer):
    """Recipient serializer."""
    
    class Meta:
        model = Recipient
        fields = ['id', 'email', 'name', 'phone', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']