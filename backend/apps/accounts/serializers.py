"""
User account serializers.
"""

from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.validators import EmailValidator
from .models import User, UserActivityLog, UserLoginHistory

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer."""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'user_type', 'account_status', 'language', 'theme',
            'daily_quota', 'total_sent', 'total_success', 'total_failed',
            'is_suspicious', 'joined_date', 'last_activity'
        ]
        read_only_fields = ['id', 'joined_date', 'last_activity']


class UserProfileSerializer(serializers.ModelSerializer):
    """User profile serializer."""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'language', 'theme', 'daily_quota', 'total_sent',
            'total_success', 'total_failed'
        ]
        read_only_fields = ['id', 'email', 'daily_quota', 'total_sent', 'total_success', 'total_failed']
    
    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.language = validated_data.get('language', instance.language)
        instance.theme = validated_data.get('theme', instance.theme)
        instance.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    """User registration serializer."""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True, 'validators': [EmailValidator()]},
        }
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "Username already taken."})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Login serializer."""
    
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    """Change password serializer."""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "Passwords do not match."})
        return data


class UserActivitySerializer(serializers.ModelSerializer):
    """User activity serializer."""
    
    class Meta:
        model = UserActivityLog
        fields = ['action', 'details', 'ip_address', 'timestamp']