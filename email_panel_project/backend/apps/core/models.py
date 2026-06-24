from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinLengthValidator
from django.utils import timezone


class SMTPSetting(models.Model):
    """تنظیمات SMTP برای ارسال ایمیل"""
    
    name = models.CharField(max_length=100, default='Default', verbose_name=_('Name'))
    host = models.CharField(max_length=255, default='smtp.gmail.com', verbose_name=_('SMTP Host'))
    port = models.IntegerField(default=587, verbose_name=_('SMTP Port'))
    use_tls = models.BooleanField(default=True, verbose_name=_('Use TLS'))
    use_ssl = models.BooleanField(default=False, verbose_name=_('Use SSL'))
    
    email = models.EmailField(verbose_name=_('Email'))
    password = models.CharField(max_length=255, verbose_name=_('Password'))
    display_name = models.CharField(max_length=100, blank=True, null=True, verbose_name=_('Display Name'))
    
    is_active = models.BooleanField(default=True, verbose_name=_('Is Active'))
    is_verified = models.BooleanField(default=False, verbose_name=_('Is Verified'))
    is_default = models.BooleanField(default=False, verbose_name=_('Is Default'))
    
    daily_limit = models.IntegerField(default=500, verbose_name=_('Daily Limit'))
    sent_today = models.IntegerField(default=0, verbose_name=_('Sent Today'))
    last_reset = models.DateField(auto_now_add=True, verbose_name=_('Last Reset'))
    
    total_sent = models.IntegerField(default=0, verbose_name=_('Total Sent'))
    total_success = models.IntegerField(default=0, verbose_name=_('Total Success'))
    total_failed = models.IntegerField(default=0, verbose_name=_('Total Failed'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'smtp_settings'
        ordering = ['-is_default', '-is_active']
        verbose_name = _('SMTP Setting')
        verbose_name_plural = _('SMTP Settings')
    
    def __str__(self):
        return f"{self.email} ({self.host}:{self.port})"
    
    def remaining_quota(self):
        if self.last_reset != timezone.now().date():
            self.sent_today = 0
            self.last_reset = timezone.now().date()
            self.save(update_fields=['sent_today', 'last_reset'])
        return max(0, self.daily_limit - self.sent_today)


class EmailTemplate(models.Model):
    """قالب‌های ایمیل - قابل تنظیم از پنل ادمین"""
    
    TEMPLATE_TYPES = (
        ('verification', 'کد تایید ثبت‌نام'),
        ('reset_password', 'بازیابی رمز عبور'),
        ('welcome', 'خوش‌آمدگویی'),
        ('campaign', 'کمپین ایمیل'),
    )
    
    name = models.CharField(max_length=100, verbose_name=_('Template Name'))
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES, unique=True, verbose_name=_('Template Type'))
    
    subject = models.CharField(max_length=255, verbose_name=_('Email Subject'))
    body = models.TextField(verbose_name=_('Email Body (HTML)'))
    
    # متغیرهای قابل استفاده: {{code}}, {{username}}, {{email}}, {{reset_link}}, {{site_name}}
    variables = models.TextField(blank=True, null=True, verbose_name=_('Available Variables'))
    
    is_active = models.BooleanField(default=True, verbose_name=_('Is Active'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'email_templates'
        verbose_name = _('Email Template')
        verbose_name_plural = _('Email Templates')
    
    def __str__(self):
        return f"{self.get_template_type_display()} - {self.name}"
    
    def render_body(self, context):
        """Render email body with context variables"""
        import re
        content = self.body
        for key, value in context.items():
            content = content.replace(f'{{{{ {key} }}}}', str(value))
            content = content.replace(f'{{{{{key}}}}}', str(value))
        return content
    
    def render_subject(self, context):
        """Render email subject with context variables"""
        import re
        content = self.subject
        for key, value in context.items():
            content = content.replace(f'{{{{ {key} }}}}', str(value))
            content = content.replace(f'{{{{{key}}}}}', str(value))
        return content


class EmailLog(models.Model):
    """لاگ ارسال ایمیل"""
    
    template = models.ForeignKey(EmailTemplate, on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_('Template'))
    smtp_setting = models.ForeignKey(SMTPSetting, on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_('SMTP Setting'))
    
    recipient = models.EmailField(verbose_name=_('Recipient'))
    subject = models.CharField(max_length=255, verbose_name=_('Subject'))
    
    status = models.CharField(max_length=20, choices=(
        ('success', '✅ موفق'),
        ('failed', '❌ ناموفق'),
        ('pending', '⏳ در انتظار'),
    ), default='pending', verbose_name=_('Status'))
    
    error_message = models.TextField(blank=True, null=True, verbose_name=_('Error Message'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Sent At'))
    
    class Meta:
        db_table = 'email_logs'
        ordering = ['-created_at']
        verbose_name = _('Email Log')
        verbose_name_plural = _('Email Logs')
    
    def __str__(self):
        return f"{self.recipient} - {self.subject} - {self.status}"