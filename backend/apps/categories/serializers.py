"""
Category serializers.
"""

from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    """Category serializer."""
    
    email_count = serializers.IntegerField(source='emails.count', read_only=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'emails',
            'email_count', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CategoryImportSerializer(serializers.Serializer):
    """Category import serializer."""
    
    emails = serializers.ListField(child=serializers.EmailField())