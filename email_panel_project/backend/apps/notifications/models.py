from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Notification(models.Model):
    """مدل اعلان‌های کاربری"""
    
    NOTIFICATION_TYPES = (
        ('info', 'اطلاعاتی'),
        ('success', 'موفقیت'),
        ('warning', 'هشدار'),
        ('error', 'خطا'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='info')
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    link = models.CharField(max_length=500, blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


class BroadcastNotification(models.Model):
    """مدل ارسال پیام همگانی (صندوق اعلانات)"""
    
    PRIORITY_CHOICES = (
        ('low', 'کم'),
        ('normal', 'معمولی'),
        ('high', 'بالا'),
        ('urgent', 'فوری'),
    )
    
    title = models.CharField(max_length=255, verbose_name='عنوان')
    message = models.TextField(verbose_name='متن پیام')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal', verbose_name='اولویت')
    
    # ارسال به همه کاربران یا گروه خاص
    send_to_all = models.BooleanField(default=True, verbose_name='ارسال به همه کاربران')
    target_users = models.ManyToManyField(User, blank=True, related_name='broadcast_notifications', verbose_name='کاربران هدف')
    
    # وضعیت
    is_sent = models.BooleanField(default=False, verbose_name='ارسال شده')
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ ارسال')
    
    # آمار
    total_recipients = models.IntegerField(default=0, verbose_name='تعداد گیرنده‌ها')
    success_count = models.IntegerField(default=0, verbose_name='تعداد موفق')
    failed_count = models.IntegerField(default=0, verbose_name='تعداد ناموفق')
    
    # زمان‌بندی
    schedule_for = models.DateTimeField(null=True, blank=True, verbose_name='زمان برنامه‌ریزی شده')
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_broadcasts', verbose_name='ایجاد کننده')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ به‌روزرسانی')
    
    class Meta:
        db_table = 'broadcast_notifications'
        ordering = ['-created_at']
        verbose_name = 'پیام همگانی'
        verbose_name_plural = 'پیام‌های همگانی'
    
    def __str__(self):
        return f"{self.title} - {self.created_at.strftime('%Y-%m-%d')}"
    
    def mark_as_sent(self):
        """علامت‌گذاری به عنوان ارسال شده"""
        self.is_sent = True
        self.sent_at = timezone.now()
        self.save()