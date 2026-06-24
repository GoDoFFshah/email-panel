"""
Core views for dashboard and common endpoints.
"""

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Sum, Avg
from apps.accounts.models import UserActivityLog
from apps.senders.models import Sender
from apps.emails.models import EmailCampaign, EmailSend
from apps.categories.models import Category
from apps.core.permissions import HasActiveAccount


class DashboardStatsView(generics.GenericAPIView):
    """Dashboard statistics view."""
    
    permission_classes = [permissions.IsAuthenticated]  # ✅ تغییر داده شد
    
    def get(self, request):
        user = request.user
        
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        
        # Sender stats
        senders = Sender.objects.filter(user=user)
        total_quota = sum(s.daily_limit for s in senders)
        used_quota = sum(s.sent_today for s in senders)
        remaining_quota = total_quota - used_quota
        
        # Campaign stats
        campaigns = EmailCampaign.objects.filter(user=user)
        total_campaigns = campaigns.count()
        active_campaigns = campaigns.filter(status__in=['sending', 'scheduled']).count()
        
        # Email stats
        sends = EmailSend.objects.filter(campaign__user=user)
        total_sends = sends.filter(status='sent').count()
        total_failed = sends.filter(status='failed').count()
        success_rate = (total_sends / (total_sends + total_failed) * 100) if (total_sends + total_failed) > 0 else 0
        
        # Category stats
        categories = Category.objects.filter(user=user)
        total_categories = categories.count()
        total_emails = sum(c.emails.count() for c in categories)
        
        # Recent activity
        recent_activity = UserActivityLog.objects.filter(
            user=user
        ).order_by('-timestamp')[:10]
        
        # Today's stats
        sends_today = sends.filter(sent_at__date=today).count()
        
        # Chart data (last 7 days)
        chart_data = []
        for i in range(7, 0, -1):
            day = today - timedelta(days=i)
            count = sends.filter(sent_at__date=day).count()
            chart_data.append({
                'date': day.strftime('%Y-%m-%d'),
                'count': count
            })
        
        return Response({
            'total_quota': total_quota,
            'used_quota': used_quota,
            'remaining_quota': remaining_quota,
            'total_campaigns': total_campaigns,
            'active_campaigns': active_campaigns,
            'total_sends': total_sends,
            'total_failed': total_failed,
            'success_rate': round(success_rate, 2),
            'total_categories': total_categories,
            'total_emails': total_emails,
            'sends_today': sends_today,
            'chart_data': chart_data,
            'recent_activity': list(recent_activity.values(
                'action', 'timestamp', 'details'
            ))[:10]
        })


class RecentActivitiesView(generics.ListAPIView):
    """Recent activities view."""
    
    permission_classes = [permissions.IsAuthenticated]  # ✅ تغییر داده شد
    
    def get(self, request):
        limit = int(request.query_params.get('limit', 20))
        
        activities = UserActivityLog.objects.filter(
            user=request.user
        ).order_by('-timestamp')[:limit]
        
        return Response({
            'activities': list(activities.values(
                'action', 'details', 'ip_address', 'timestamp'
            )),
            'total': UserActivityLog.objects.filter(user=request.user).count()
        })