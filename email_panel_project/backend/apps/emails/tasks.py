"""
Celery tasks for email sending.
"""

from celery import shared_task
from django.core.cache import cache
from django.utils import timezone
from django.db import transaction
from .models import EmailCampaign, EmailSend, RecipientTracking
from apps.senders.models import Sender
from apps.core.utils import send_single_email, decrypt_password
import logging
import time

logger = logging.getLogger(__name__)


@shared_task
def send_campaign(campaign_id):
    """Send email campaign."""
    try:
        campaign = EmailCampaign.objects.get(id=campaign_id)
    except EmailCampaign.DoesNotExist:
        logger.error(f"Campaign {campaign_id} not found")
        return
    
    if campaign.status != 'sending':
        logger.warning(f"Campaign {campaign_id} is not in sending state")
        return
    
    senders = list(campaign.senders.filter(is_active=True, is_verified=True))
    if not senders:
        campaign.status = 'failed'
        campaign.save()
        logger.error(f"No active senders for campaign {campaign_id}")
        return
    
    # Get pending recipients
    pending = campaign.pending_recipients
    if not pending:
        campaign.status = 'completed'
        campaign.completed_at = timezone.now()
        campaign.save()
        return
    
    # Send emails
    sender_index = 0
    total_sent = 0
    success_count = 0
    failed_count = 0
    failed_list = []
    
    for recipient in pending:
        try:
            sender = senders[sender_index % len(senders)]
            sender_index += 1
            
            # Check sender quota
            if sender.remaining_quota() <= 0:
                # Find next sender with quota
                found = False
                for _ in range(len(senders)):
                    sender_index += 1
                    sender = senders[sender_index % len(senders)]
                    if sender.remaining_quota() > 0:
                        found = True
                        break
                
                if not found:
                    # No sender with quota left
                    remaining = pending[total_sent:]
                    campaign.pending_recipients = remaining
                    campaign.sent_count = total_sent
                    campaign.success_count = success_count
                    campaign.failed_count = failed_count
                    campaign.save()
                    logger.warning(f"All senders exhausted quota for campaign {campaign_id}")
                    return
            
            # Send email
            password = decrypt_password(sender.password)
            result = send_single_email(
                sender_email=sender.email,
                sender_password=password,
                to_email=recipient,
                subject=campaign.subject,
                body=campaign.body,
                body_html=campaign.body_html,
                attachment=campaign.attachment.path if campaign.attachment and hasattr(campaign.attachment, 'path') else None,
                smtp_host=sender.smtp_host,
                smtp_port=sender.smtp_port
            )
            
            # Record send
            email_send = EmailSend.objects.create(
                campaign=campaign,
                sender=sender,
                recipient_email=recipient,
                subject=campaign.subject,
                body=campaign.body,
                status='sent' if result['success'] else 'failed',
                sent_at=timezone.now()
            )
            
            if result['success']:
                success_count += 1
                sender.sent_today += 1
                sender.total_sent += 1
                sender.last_used = timezone.now()
                sender.save()
                
                # Update recipient tracking
                tracking, _ = RecipientTracking.objects.get_or_create(
                    user=campaign.user,
                    email=recipient
                )
                tracking.total_sent += 1
                tracking.last_sent = timezone.now()
                if not tracking.first_sent:
                    tracking.first_sent = timezone.now()
                tracking.save()
            else:
                failed_count += 1
                failed_list.append(f"{recipient}: {result.get('error', 'Unknown error')}")
                email_send.error_message = result.get('error', 'Unknown error')
                email_send.save()
            
            total_sent += 1
            
            # Update campaign progress
            if total_sent % 10 == 0 or total_sent == len(pending):
                campaign.sent_count = total_sent
                campaign.success_count = success_count
                campaign.failed_count = failed_count
                campaign.save()
                logger.info(f"Campaign {campaign_id}: Sent {total_sent}/{len(pending)}")
            
            # Rate limiting
            time.sleep(2)
            
        except Exception as e:
            logger.error(f"Error sending email to {recipient}: {e}")
            failed_count += 1
            total_sent += 1
            failed_list.append(f"{recipient}: {str(e)}")
            
            EmailSend.objects.create(
                campaign=campaign,
                recipient_email=recipient,
                subject=campaign.subject,
                body=campaign.body,
                status='failed',
                error_message=str(e),
                sent_at=timezone.now()
            )
    
    # Update campaign
    campaign.sent_count = total_sent
    campaign.success_count = success_count
    campaign.failed_count = failed_count
    campaign.pending_recipients = []
    
    if success_count > 0 and failed_count == 0:
        campaign.status = 'completed'
        campaign.completed_at = timezone.now()
    elif success_count == 0 and failed_count > 0:
        campaign.status = 'failed'
        campaign.completed_at = timezone.now()
    else:
        campaign.status = 'completed'
        campaign.completed_at = timezone.now()
    
    campaign.save()
    
    logger.info(f"Campaign {campaign_id} completed: {success_count} success, {failed_count} failed")
    
    # Return summary
    return {
        'campaign_id': campaign_id,
        'total': total_sent,
        'success': success_count,
        'failed': failed_count,
        'failed_list': failed_list[:10]  # فقط 10 خطای اول
    }


@shared_task
def process_recipients(email_list, user_id, category_name=None):
    """Process and import recipient list."""
    from apps.accounts.models import User
    from apps.categories.models import Category
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return
    
    created = 0
    updated = 0
    invalid = []
    
    for email in email_list:
        if not email or '@' not in email:
            invalid.append(email)
            continue
            
        tracking, is_new = RecipientTracking.objects.get_or_create(
            user=user,
            email=email
        )
        
        if is_new:
            created += 1
            if category_name:
                tracking.categories.append(category_name)
                tracking.save()
        else:
            updated += 1
    
    logger.info(f"Processed {len(email_list)} emails: {created} created, {updated} updated, {len(invalid)} invalid")
    
    return {
        'created': created,
        'updated': updated,
        'invalid': len(invalid),
        'invalid_list': invalid[:10]
    }


@shared_task
def reset_daily_quotas():
    """Reset all sender daily quotas."""
    from apps.senders.models import Sender
    from django.utils import timezone
    
    updated = Sender.objects.all().update(sent_today=0)
    logger.info(f"Reset daily quotas for {updated} senders")
    return updated


@shared_task
def send_scheduled_campaigns():
    """Send scheduled campaigns."""
    campaigns = EmailCampaign.objects.filter(
        status='scheduled',
        scheduled_for__lte=timezone.now()
    )
    
    count = 0
    for campaign in campaigns:
        campaign.status = 'sending'
        campaign.save()
        send_campaign.delay(str(campaign.id))
        logger.info(f"Started scheduled campaign: {campaign.name}")
        count += 1
    
    return count


# ✅ تابع کمکی برای ارسال همگام (بدون Celery)
def send_campaign_sync(campaign_id):
    """Send campaign synchronously (for testing without Celery)."""
    return send_campaign(campaign_id)