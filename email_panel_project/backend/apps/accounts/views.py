"""
User account views for authentication and profile management.
"""

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.cache import cache
from django.db import models
from .serializers import (
    UserSerializer, UserProfileSerializer, RegisterSerializer,
    LoginSerializer, ChangePasswordSerializer, UserActivitySerializer
)
from .models import UserActivityLog, UserLoginHistory
from apps.core.permissions import IsOwnerOrAdmin, IsAdminOrSuperAdmin
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """User registration view."""
    
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Log registration
        UserActivityLog.objects.create(
            user=user,
            action='register',
            details={'ip': self.get_client_ip(request)},
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class LoginView(APIView):
    """User login view - supports both username and email."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        username_or_email = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        # ✅ Try to find user by username or email
        user = None
        
        # Check if input is email or username
        if '@' in username_or_email:
            # Login with email
            try:
                user_obj = User.objects.get(email=username_or_email)
                user = authenticate(request=request, username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass
        else:
            # Login with username
            user = authenticate(request=request, username=username_or_email, password=password)
        
        if not user:
            # Log failed attempt
            try:
                # Try to find user for logging
                user_obj = None
                if '@' in username_or_email:
                    try:
                        user_obj = User.objects.get(email=username_or_email)
                    except User.DoesNotExist:
                        pass
                else:
                    try:
                        user_obj = User.objects.get(username=username_or_email)
                    except User.DoesNotExist:
                        pass
                
                if user_obj:
                    UserLoginHistory.objects.create(
                        user=user_obj,
                        ip_address=self.get_client_ip(request),
                        user_agent=request.META.get('HTTP_USER_AGENT', ''),
                        status='failed'
                    )
                    user_obj.login_attempts += 1
                    user_obj.save()
            except:
                pass
            
            return Response({
                'error': 'Invalid username or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if user.account_status == 'banned':
            return Response({
                'error': 'This account has been banned'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if user.account_status == 'suspended':
            return Response({
                'error': 'This account is suspended'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Successful login
        refresh = RefreshToken.for_user(user)
        
        # Update user
        user.last_login = timezone.now()
        user.last_login_ip = self.get_client_ip(request)
        user.last_login_user_agent = request.META.get('HTTP_USER_AGENT', '')
        user.login_attempts = 0
        user.save()
        
        # Log login
        UserLoginHistory.objects.create(
            user=user,
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            status='success'
        )
        
        UserActivityLog.objects.create(
            user=user,
            action='login',
            details={'ip': self.get_client_ip(request)},
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class LogoutView(APIView):
    """User logout view."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception as e:
            logger.warning(f"Logout error: {e}")
        
        # Log logout
        UserActivityLog.objects.create(
            user=request.user,
            action='logout',
            details={'ip': self.get_client_ip(request)},
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({'message': 'Logged out successfully'})
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class ProfileView(generics.RetrieveUpdateAPIView):
    """User profile view."""
    
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """Change user password."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({
                'error': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        UserActivityLog.objects.create(
            user=user,
            action='change_password',
            details={'ip': self.get_client_ip(request)},
            ip_address=self.get_client_ip(request)
        )
        
        return Response({'message': 'Password changed successfully'})
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class UserActivityView(generics.ListAPIView):
    """View user activities."""
    
    serializer_class = UserActivitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserActivityLog.objects.filter(user=self.request.user)[:100]


class UserListView(generics.ListAPIView):
    """List users (admin only)."""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSuperAdmin]
    
    def get_queryset(self):
        queryset = User.objects.all()
        
        # Filters
        user_type = self.request.query_params.get('user_type')
        status = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        if status:
            queryset = queryset.filter(account_status=status)
        if search:
            queryset = queryset.filter(
                models.Q(username__icontains=search) |
                models.Q(email__icontains=search) |
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search)
            )
        
        return queryset


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """User detail view (admin only)."""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSuperAdmin]
    queryset = User.objects.all()
    lookup_field = 'id'