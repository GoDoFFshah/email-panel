"""
Sender management views.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Sender, SenderGroup
from .serializers import SenderSerializer, SenderGroupSerializer
from apps.core.permissions import IsOwner, HasActiveAccount
from apps.core.utils import test_smtp_connection
from apps.accounts.models import UserActivityLog
import logging

logger = logging.getLogger(__name__)


class SenderViewSet(viewsets.ModelViewSet):
    """Sender CRUD operations."""
    
    serializer_class = SenderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Sender.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # رمز رو بدون رمزنگاری ذخیره کن
        password = serializer.validated_data.get('password')
        if password:
            serializer.validated_data['password'] = password
        serializer.save(user=self.request.user)
        
        UserActivityLog.objects.create(
            user=self.request.user,
            action='create_sender',
            details={'email': serializer.instance.email},
            ip_address=self.get_client_ip(self.request)
        )
    
    def perform_update(self, serializer):
        old_status = serializer.instance.is_active
        password = serializer.validated_data.get('password')
        if password:
            serializer.validated_data['password'] = password
        serializer.save()
        
        UserActivityLog.objects.create(
            user=self.request.user,
            action='update_sender',
            details={
                'email': serializer.instance.email,
                'old_status': old_status,
                'new_status': serializer.instance.is_active
            },
            ip_address=self.get_client_ip(self.request)
        )
    
    def perform_destroy(self, instance):
        email = instance.email
        instance.delete()
        
        UserActivityLog.objects.create(
            user=self.request.user,
            action='delete_sender',
            details={'email': email},
            ip_address=self.get_client_ip(self.request)
        )
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test SMTP connection."""
        sender = self.get_object()
        
        # استفاده مستقیم از رمز (بدون decrypt)
        password = sender.password
        
        result = test_smtp_connection(
            sender.email, password,
            sender.smtp_host, sender.smtp_port
        )
        
        if result['success']:
            sender.is_verified = True
            sender.is_active = True
            sender.save()
            
            UserActivityLog.objects.create(
                user=request.user,
                action='test_sender',
                details={'email': sender.email, 'success': True},
                ip_address=self.get_client_ip(request)
            )
            
            return Response({
                'success': True,
                'message': '✅ اتصال SMTP با موفقیت برقرار شد!',
                'verified': True,
                'active': True
            })
        else:
            sender.is_verified = False
            sender.is_active = False
            sender.save()
            
            error_msg = result.get('error', 'اتصال SMTP ناموفق بود')
            
            UserActivityLog.objects.create(
                user=request.user,
                action='test_sender',
                details={'email': sender.email, 'success': False, 'error': error_msg},
                ip_address=self.get_client_ip(request)
            )
            
            return Response({
                'success': False,
                'error': f'❌ {error_msg}',
                'verified': False,
                'active': False
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Toggle sender active status."""
        sender = self.get_object()
        
        if sender.is_active:
            sender.is_active = False
            sender.save()
            message = 'فرستنده غیرفعال شد'
        else:
            if not sender.is_verified:
                return Response({
                    'error': '❌ این فرستنده تایید نشده است. ابتدا اتصال SMTP را تست کنید.'
                }, status=status.HTTP_400_BAD_REQUEST)
            sender.is_active = True
            sender.save()
            message = 'فرستنده فعال شد'
        
        UserActivityLog.objects.create(
            user=request.user,
            action='toggle_sender',
            details={
                'email': sender.email,
                'new_status': sender.is_active
            },
            ip_address=self.get_client_ip(request)
        )
        
        return Response({
            'is_active': sender.is_active,
            'is_verified': sender.is_verified,
            'message': message
        })
    
    @action(detail=True, methods=['post'])
    def set_primary(self, request, pk=None):
        """Set sender as primary."""
        sender = self.get_object()
        
        if not sender.is_active or not sender.is_verified:
            return Response({
                'error': '❌ فرستنده باید فعال و تایید شده باشد.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        Sender.objects.filter(user=request.user, is_primary=True).update(is_primary=False)
        
        sender.is_primary = True
        sender.save()
        
        UserActivityLog.objects.create(
            user=request.user,
            action='set_primary_sender',
            details={'email': sender.email},
            ip_address=self.get_client_ip(request)
        )
        
        return Response({'is_primary': True})
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active senders."""
        senders = Sender.objects.filter(user=request.user, is_active=True, is_verified=True)
        serializer = self.get_serializer(senders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def quota_status(self, request):
        """Get quota status for all senders."""
        senders = Sender.objects.filter(user=request.user)
        data = []
        total_quota = 0
        used_quota = 0
        
        for sender in senders:
            remaining = sender.remaining_quota()
            total_quota += sender.daily_limit
            used_quota += sender.sent_today
            data.append({
                'email': sender.email,
                'daily_limit': sender.daily_limit,
                'sent_today': sender.sent_today,
                'remaining': remaining,
                'is_active': sender.is_active,
                'is_verified': sender.is_verified
            })
        
        return Response({
            'senders': data,
            'total_quota': total_quota,
            'used_quota': used_quota,
            'remaining_quota': total_quota - used_quota
        })
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class SenderGroupViewSet(viewsets.ModelViewSet):
    """Sender group management."""
    
    serializer_class = SenderGroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SenderGroup.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_sender(self, request, pk=None):
        """Add sender to group."""
        group = self.get_object()
        sender_id = request.data.get('sender_id')
        
        sender = get_object_or_404(Sender, id=sender_id, user=request.user)
        group.senders.add(sender)
        
        return Response({'message': 'Sender added to group'})
    
    @action(detail=True, methods=['post'])
    def remove_sender(self, request, pk=None):
        """Remove sender from group."""
        group = self.get_object()
        sender_id = request.data.get('sender_id')
        
        sender = get_object_or_404(Sender, id=sender_id, user=request.user)
        group.senders.remove(sender)
        
        return Response({'message': 'Sender removed from group'})