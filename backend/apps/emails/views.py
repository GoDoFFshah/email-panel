"""
Email sending views.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from .models import EmailCampaign, EmailSend, RecipientTracking
from .serializers import (
    EmailCampaignSerializer, EmailSendSerializer,
    RecipientTrackingSerializer, SendEmailSerializer,
    BulkSendStatusSerializer
)
from .tasks import send_campaign, process_recipients
from apps.senders.models import Sender
from apps.categories.models import Category
from apps.core.permissions import IsOwner, HasActiveAccount, CanSendEmail
from apps.accounts.models import UserActivityLog
import logging

logger = logging.getLogger(__name__)


class EmailCampaignViewSet(viewsets.ModelViewSet):
    """Email campaign management."""
    
    serializer_class = EmailCampaignSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return campaigns for the current user."""
        return EmailCampaign.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """ذخیره کمپین با به‌روزرسانی total_recipients"""
        campaign = serializer.save(user=self.request.user)
        
        # ✅ به‌روزرسانی total_recipients بر اساس recipients
        if campaign.recipients:
            campaign.total_recipients = len(campaign.recipients)
            campaign.save(update_fields=['total_recipients'])
        
        # اگر از categories استفاده می‌کند، تعداد رو محاسبه کن
        if campaign.categories and not campaign.recipients:
            recipients = self._get_recipients(campaign)
            campaign.total_recipients = len(recipients)
            campaign.save(update_fields=['total_recipients'])
        
        UserActivityLog.objects.create(
            user=self.request.user,
            action='create_campaign',
            details={'name': campaign.name},
            ip_address=self.get_client_ip(self.request)
        )
    
    def perform_update(self, serializer):
        """به‌روزرسانی کمپین با محاسبه مجدد total_recipients"""
        campaign = self.get_object()
        old_status = campaign.status
        
        # ذخیره تغییرات
        campaign = serializer.save()
        
        # ✅ به‌روزرسانی total_recipients
        if campaign.recipients:
            campaign.total_recipients = len(campaign.recipients)
            campaign.save(update_fields=['total_recipients'])
        elif campaign.categories:
            recipients = self._get_recipients(campaign)
            campaign.total_recipients = len(recipients)
            campaign.save(update_fields=['total_recipients'])
        else:
            campaign.total_recipients = 0
            campaign.save(update_fields=['total_recipients'])
        
        UserActivityLog.objects.create(
            user=self.request.user,
            action='update_campaign',
            details={
                'name': campaign.name,
                'old_status': old_status,
                'new_status': campaign.status
            },
            ip_address=self.get_client_ip(self.request)
        )
    
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Send campaign - بدون Celery (همگام)"""
        campaign = self.get_object()
        
        # ✅ بررسی وضعیت کمپین
        if campaign.status == 'sending':
            return Response({
                'error': '⏳ این کمپین در حال ارسال است!'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if campaign.status not in ['draft', 'paused']:
            return Response({
                'error': f'Cannot send campaign with status: {campaign.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ✅ بررسی وجود گیرنده (مهم!)
        recipients = self._get_recipients(campaign)
        if not recipients:
            return Response({
                'error': '❌ این کمپین هیچ گیرنده‌ای ندارد! لطفاً ابتدا گیرنده اضافه کنید.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ✅ بررسی تعداد گیرنده‌ها
        if len(recipients) == 0:
            return Response({
                'error': '❌ تعداد گیرنده‌ها صفر است!'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get senders
        sender_ids = request.data.get('sender_ids', [])
        if sender_ids:
            senders = Sender.objects.filter(
                id__in=sender_ids,
                user=request.user,
                is_active=True
            )
        else:
            senders = Sender.objects.filter(
                user=request.user,
                is_active=True,
                is_verified=True
            )
        
        if not senders.exists():
            return Response({
                'error': '❌ هیچ فرستنده فعالی وجود ندارد! لطفاً ابتدا یک فرستنده اضافه و تست کنید.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ✅ بررسی سهمیه فرستنده‌ها
        has_quota = False
        for sender in senders:
            if sender.remaining_quota() > 0:
                has_quota = True
                break
        
        if not has_quota:
            return Response({
                'error': '❌ سهمیه روزانه همه فرستنده‌ها تمام شده است!'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update campaign
        campaign.status = 'sending'
        campaign.started_at = timezone.now()
        campaign.total_recipients = len(recipients)
        campaign.pending_recipients = recipients
        campaign.senders.set(senders)
        campaign.save()
        
        # ✅ ارسال همگام (بدون Celery) - جلوگیری از timeout
        try:
            from apps.emails.tasks import send_campaign as send_campaign_sync
            send_campaign_sync(str(campaign.id))
        except Exception as e:
            campaign.status = 'draft'
            campaign.save()
            logger.error(f"Error sending campaign: {e}")
            return Response({
                'error': f'❌ خطا در ارسال کمپین: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        UserActivityLog.objects.create(
            user=request.user,
            action='send_campaign',
            details={
                'campaign': campaign.name,
                'recipients': len(recipients),
                'senders': list(senders.values_list('email', flat=True))
            },
            ip_address=self.get_client_ip(request)
        )
        
        return Response({
            'message': f'✅ ارسال کمپین شروع شد! ({len(recipients)} گیرنده)',
            'campaign_id': str(campaign.id),
            'total_recipients': len(recipients)
        })
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause campaign."""
        campaign = self.get_object()
        
        if campaign.status != 'sending':
            return Response({
                'error': f'Cannot pause campaign with status: {campaign.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        campaign.status = 'paused'
        campaign.save()
        
        return Response({
            'message': '⏸️ کمپین متوقف شد',
            'status': campaign.status
        })
    
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume campaign - همگام"""
        campaign = self.get_object()
        
        if campaign.status != 'paused':
            return Response({
                'error': f'Cannot resume campaign with status: {campaign.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        campaign.status = 'sending'
        campaign.save()
        
        # ✅ ادامه همگام
        try:
            from apps.emails.tasks import send_campaign as send_campaign_sync
            send_campaign_sync(str(campaign.id))
        except Exception as e:
            campaign.status = 'paused'
            campaign.save()
            logger.error(f"Error resuming campaign: {e}")
            return Response({
                'error': f'❌ خطا در ادامه کمپین: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'message': '▶️ کمپین ادامه یافت',
            'status': campaign.status
        })
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get campaign status."""
        campaign = self.get_object()
        
        return Response({
            'status': campaign.status,
            'total': campaign.total_recipients,
            'sent': campaign.sent_count,
            'success': campaign.success_count,
            'failed': campaign.failed_count,
            'progress': campaign.progress(),
            'pending': len(campaign.pending_recipients)
        })
    
    @action(detail=True, methods=['get'])
    def sends(self, request, pk=None):
        """Get sends for campaign."""
        campaign = self.get_object()
        sends = EmailSend.objects.filter(campaign=campaign).order_by('-created_at')
        
        page = self.paginate_queryset(sends)
        if page is not None:
            serializer = EmailSendSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = EmailSendSerializer(sends, many=True)
        return Response(serializer.data)
    
    def _get_recipients(self, campaign):
        """Get recipients based on campaign configuration."""
        recipients = []
        
        if campaign.categories:
            # Get from categories
            for category_name in campaign.categories:
                try:
                    category = Category.objects.get(
                        user=self.request.user,
                        name=category_name
                    )
                    recipients.extend(category.emails)
                except Category.DoesNotExist:
                    pass
        
        if campaign.recipients:
            recipients.extend(campaign.recipients)
        
        # Remove duplicates
        return list(set(recipients))
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class EmailSendViewSet(viewsets.ReadOnlyModelViewSet):
    """Email send tracking view."""
    
    serializer_class = EmailSendSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return EmailSend.objects.filter(
            campaign__user=self.request.user
        ).order_by('-created_at')


class RecipientTrackingViewSet(viewsets.ModelViewSet):
    """Recipient tracking management."""
    
    serializer_class = RecipientTrackingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return RecipientTracking.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def import_bulk(self, request):
        """Import multiple recipients."""
        emails = request.data.get('emails', [])
        category = request.data.get('category', '')
        
        created = 0
        updated = 0
        invalid = []
        
        for email in emails:
            if not email or '@' not in email:
                invalid.append(email)
                continue
            
            obj, is_new = RecipientTracking.objects.get_or_create(
                user=request.user,
                email=email,
                defaults={'source': 'import'}
            )
            
            if is_new:
                created += 1
            else:
                updated += 1
            
            if category and category not in obj.categories:
                obj.categories.append(category)
                obj.save()
        
        UserActivityLog.objects.create(
            user=request.user,
            action='import_recipients',
            details={
                'created': created,
                'updated': updated,
                'invalid': len(invalid)
            },
            ip_address=self.get_client_ip(request)
        )
        
        return Response({
            'created': created,
            'updated': updated,
            'invalid': invalid[:10]
        })
    
    @action(detail=False, methods=['get'])
    def priority(self, request):
        """Get recipients sorted by priority."""
        limit = request.query_params.get('limit', 100)
        
        recipients = RecipientTracking.objects.filter(
            user=request.user,
            is_active=True
        )
        
        recipient_list = []
        for r in recipients:
            score = r.get_priority_score()
            recipient_list.append({
                'email': r.email,
                'name': r.name,
                'score': score,
                'total_sent': r.total_sent,
                'last_sent': r.last_sent
            })
        
        recipient_list.sort(key=lambda x: x['score'])
        
        return Response(recipient_list[:int(limit)])
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle recipient active status."""
        recipient = self.get_object()
        recipient.is_active = not recipient.is_active
        recipient.save()
        
        return Response({'is_active': recipient.is_active})
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')