"""
Email serializers.
"""

from rest_framework import serializers
from .models import EmailCampaign, EmailSend, RecipientTracking
from apps.senders.serializers import SenderSerializer


class EmailCampaignSerializer(serializers.ModelSerializer):
    """Email campaign serializer."""
    
    senders = SenderSerializer(many=True, read_only=True)
    progress = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = EmailCampaign
        fields = [
            'id', 'name', 'subject', 'body', 'body_html',
            'status', 'priority_mode', 'scheduled_for',
            'started_at', 'completed_at',
            'total_recipients', 'sent_count', 'success_count',
            'failed_count', 'open_count', 'click_count',
            'senders', 'categories', 'recipients', 'pending_recipients',
            'attachment', 'progress', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        if data.get('status') == 'scheduled' and not data.get('scheduled_for'):
            raise serializers.ValidationError(
                "scheduled_for is required when status is 'scheduled'"
            )
        return data
    
    def to_representation(self, instance):
        """اضافه کردن اطلاعات اضافی به خروجی"""
        data = super().to_representation(instance)
        # اگر recipients خالی بود، از categories دریافت کن
        if not data.get('recipients') and data.get('categories'):
            recipients = []
            from apps.categories.models import Category
            for category_name in data.get('categories', []):
                try:
                    category = Category.objects.get(
                        user=instance.user,
                        name=category_name
                    )
                    recipients.extend(category.emails)
                except Category.DoesNotExist:
                    pass
            data['recipients'] = list(set(recipients))
            data['total_recipients'] = len(data['recipients'])
        return data


class EmailSendSerializer(serializers.ModelSerializer):
    """Email send serializer."""
    
    class Meta:
        model = EmailSend
        fields = [
            'id', 'campaign', 'sender', 'recipient_email',
            'recipient_name', 'subject', 'body', 'status',
            'error_message', 'sent_at', 'delivered_at',
            'opened_at', 'tracking_id', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'tracking_id']


class RecipientTrackingSerializer(serializers.ModelSerializer):
    """Recipient tracking serializer."""
    
    priority_score = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = RecipientTracking
        fields = [
            'id', 'email', 'name', 'first_sent', 'last_sent',
            'total_sent', 'total_opened', 'total_clicked',
            'total_bounced', 'categories', 'is_active',
            'is_subscribed', 'is_bounced', 'priority_score',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SendEmailSerializer(serializers.Serializer):
    """Send email request serializer."""
    
    subject = serializers.CharField(max_length=500)
    body = serializers.CharField()
    body_html = serializers.CharField(required=False, allow_blank=True)
    
    recipient_type = serializers.ChoiceField(choices=['single', 'category', 'all'])
    recipients = serializers.ListField(
        child=serializers.EmailField(),
        required=False,
        default=list
    )
    category = serializers.CharField(required=False, allow_blank=True)
    
    priority_mode = serializers.ChoiceField(
        choices=['smart', 'never_sent', 'oldest', 'random', 'sequential'],
        default='smart'
    )
    
    sender_ids = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    
    schedule_for = serializers.DateTimeField(required=False, allow_null=True)
    
    def validate(self, data):
        recipient_type = data.get('recipient_type')
        
        if recipient_type == 'single' and not data.get('recipients'):
            raise serializers.ValidationError(
                "recipients are required for 'single' recipient_type"
            )
        
        if recipient_type == 'category' and not data.get('category'):
            raise serializers.ValidationError(
                "category is required for 'category' recipient_type"
            )
        
        return data


class BulkSendStatusSerializer(serializers.Serializer):
    """Bulk send status serializer."""
    
    total = serializers.IntegerField()
    sent = serializers.IntegerField()
    success = serializers.IntegerField()
    failed = serializers.IntegerField()
    pending = serializers.IntegerField()
    progress = serializers.IntegerField()
    status = serializers.CharField()


class CampaignUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating campaign (including recipients)."""
    
    class Meta:
        model = EmailCampaign
        fields = [
            'id', 'name', 'subject', 'body', 'body_html',
            'status', 'priority_mode', 'scheduled_for',
            'recipients', 'categories', 'attachment'
        ]
    
    def update(self, instance, validated_data):
        # به‌روزرسانی recipients اگر ارسال شده باشد
        if 'recipients' in validated_data:
            # حذف تکراری‌ها
            recipients = list(set(validated_data['recipients']))
            validated_data['recipients'] = recipients
            # به‌روزرسانی تعداد
            instance.total_recipients = len(recipients)
        
        return super().update(instance, validated_data)