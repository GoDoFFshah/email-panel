"""
Admin panel views for system monitoring and management.
"""
from rest_framework import viewsets, permissions
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum, Q, Avg
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from apps.accounts.models import UserActivityLog, UserLoginHistory
from apps.senders.models import Sender
from apps.emails.models import EmailCampaign, EmailSend
from apps.categories.models import Category
from apps.core.permissions import IsSuperAdmin
from .serializers import (
    AdminUserSerializer, SystemStatsSerializer,
    ActivityLogSerializer, SecurityReportSerializer
)

User = get_user_model()

class AdminPanelViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get system statistics."""
        
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        
        # User stats
        total_users = User.objects.count()
        active_users = User.objects.filter(account_status='active').count()
        banned_users = User.objects.filter(account_status='banned').count()
        new_users_week = User.objects.filter(date_joined__date__gte=week_ago).count()
        
        # Email stats
        total_campaigns = EmailCampaign.objects.count()
        total_sends = EmailSend.objects.count()
        success_sends = EmailSend.objects.filter(status='sent').count()
        failed_sends = EmailSend.objects.filter(status='failed').count()
        emails_today = EmailSend.objects.filter(sent_at__date=today).count()
        
        # Sender stats
        total_senders = Sender.objects.count()
        active_senders = Sender.objects.filter(is_active=True, is_verified=True).count()
        
        # Category stats
        total_categories = Category.objects.count()
        total_emails_in_categories = sum(
            c.emails.count() for c in Category.objects.all()
        )
        
        # Security stats
        suspicious_users = User.objects.filter(is_suspicious=True).count()
        failed_logins_today = UserLoginHistory.objects.filter(
            status='failed',
            timestamp__date=today
        ).count()
        
        return Response({
            'users': {
                'total': total_users,
                'active': active_users,
                'banned': banned_users,
                'new_this_week': new_users_week
            },
            'emails': {
                'total_campaigns': total_campaigns,
                'total_sends': total_sends,
                'success_sends': success_sends,
                'failed_sends': failed_sends,
                'sent_today': emails_today,
                'success_rate': round(
                    (success_sends / total_sends * 100) if total_sends > 0 else 0,
                    2
                )
            },
            'senders': {
                'total': total_senders,
                'active': active_senders
            },
            'categories': {
                'total': total_categories,
                'total_emails': total_emails_in_categories
            },
            'security': {
                'suspicious_users': suspicious_users,
                'failed_logins_today': failed_logins_today
            },
            'timestamp': timezone.now().isoformat()
        })
    
    @action(detail=False, methods=['get'])
    def users(self, request):
        """List all users with advanced filters."""
        
        queryset = User.objects.all()
        
        # Filters
        user_type = request.query_params.get('user_type')
        status = request.query_params.get('status')
        is_suspicious = request.query_params.get('is_suspicious')
        search = request.query_params.get('search')
        sort_by = request.query_params.get('sort_by', '-joined_date')
        
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        if status:
            queryset = queryset.filter(account_status=status)
        if is_suspicious is not None:
            queryset = queryset.filter(
                is_suspicious=is_suspicious.lower() == 'true'
            )
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        # Annotate with stats
        queryset = queryset.annotate(
            total_sends=Count('campaigns__sends'),
            success_sends=Count('campaigns__sends', filter=Q(campaigns__sends__status='sent'))
        )
        
        queryset = queryset.order_by(sort_by)
        
        page = self.paginate_queryset(queryset)
        serializer = AdminUserSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        """Block a user."""
        user = self.get_object()
        
        if user.user_type == 'super_admin':
            return Response({
                'error': 'Cannot block super admin'
            }, status=status.HTTP_403_FORBIDDEN)
        
        reason = request.data.get('reason', 'No reason provided')
        
        user.account_status = 'banned'
        user.is_active = False
        user.save()
        
        UserActivityLog.objects.create(
            user=user,
            action='blocked_by_admin',
            details={
                'reason': reason,
                'blocked_by': request.user.username
            },
            ip_address=self.get_client_ip(request)
        )
        
        return Response({
            'message': f'User {user.username} blocked',
            'reason': reason
        })
    
    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):
        """Unblock a user."""
        user = self.get_object()
        
        user.account_status = 'active'
        user.is_active = True
        user.save()
        
        UserActivityLog.objects.create(
            user=user,
            action='unblocked_by_admin',
            details={'unblocked_by': request.user.username},
            ip_address=self.get_client_ip(request)
        )
        
        return Response({'message': f'User {user.username} unblocked'})
    
    @action(detail=True, methods=['post'])
    def flag_suspicious(self, request, pk=None):
        """Flag a user as suspicious."""
        user = self.get_object()
        
        reason = request.data.get('reason', 'Suspicious activity detected')
        
        user.is_suspicious = True
        user.suspicious_reason = reason
        user.flagged_at = timezone.now()
        user.save()
        
        UserActivityLog.objects.create(
            user=user,
            action='flagged_suspicious',
            details={
                'reason': reason,
                'flagged_by': request.user.username
            },
            ip_address=self.get_client_ip(request)
        )
        
        return Response({
            'message': f'User {user.username} flagged as suspicious',
            'reason': reason
        })
    
    @action(detail=True, methods=['post'])
    def reset_quota(self, request, pk=None):
        """Reset user's quota."""
        user = self.get_object()
        
        Sender.objects.filter(user=user).update(
            sent_today=0,
            last_reset=timezone.now().date()
        )
        
        UserActivityLog.objects.create(
            user=user,
            action='quota_reset_by_admin',
            details={'reset_by': request.user.username},
            ip_address=self.get_client_ip(request)
        )
        
        return Response({
            'message': f'Quota reset for {user.username}',
            'reset_at': timezone.now().isoformat()
        })
    
    @action(detail=False, methods=['get'])
    def activities(self, request):
        """Get recent activities."""
        
        limit = int(request.query_params.get('limit', 100))
        action_type = request.query_params.get('action')
        
        queryset = UserActivityLog.objects.all()
        
        if action_type:
            queryset = queryset.filter(action__icontains=action_type)
        
        queryset = queryset.order_by('-timestamp')[:limit]
        serializer = ActivityLogSerializer(queryset, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def security_report(self, request):
        """Generate security report."""
        
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        
        # Failed logins by IP
        failed_ips = UserLoginHistory.objects.filter(
            status='failed',
            timestamp__date__gte=week_ago
        ).values('ip_address').annotate(
            count=Count('id')
        ).order_by('-count')[:20]
        
        # Suspicious users
        suspicious_users = User.objects.filter(
            is_suspicious=True
        ).values('username', 'email', 'suspicious_reason', 'flagged_at')
        
        # Activity summary
        total_activities = UserActivityLog.objects.filter(
            timestamp__date__gte=week_ago
        ).count()
        
        # User growth
        user_growth = User.objects.filter(
            joined_date__date__gte=week_ago
        ).count()
        
        return Response({
            'period': {
                'start': week_ago.isoformat(),
                'end': today.isoformat()
            },
            'failed_logins_by_ip': failed_ips,
            'suspicious_users': suspicious_users,
            'total_activities': total_activities,
            'new_users_this_week': user_growth,
            'generated_at': timezone.now().isoformat()
        })
    
    @action(detail=False, methods=['get'])
    def system_health(self, request):
        """Check system health."""
        
        import os
        import psutil
        
        # Database status
        try:
            User.objects.exists()
            db_healthy = True
        except:
            db_healthy = False
        
        # Cache status
        from django.core.cache import cache
        try:
            cache.set('health_check', 'ok', 10)
            cache_healthy = cache.get('health_check') == 'ok'
        except:
            cache_healthy = False
        
        return Response({
            'status': 'healthy' if db_healthy and cache_healthy else 'degraded',
            'database': 'healthy' if db_healthy else 'unhealthy',
            'cache': 'healthy' if cache_healthy else 'unhealthy',
            'memory_usage': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'timestamp': timezone.now().isoformat()
        })
    
    def get_object(self):
        """Get user by ID."""
        from django.shortcuts import get_object_or_404
        user_id = self.kwargs.get('pk')
        return get_object_or_404(User, id=user_id)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')