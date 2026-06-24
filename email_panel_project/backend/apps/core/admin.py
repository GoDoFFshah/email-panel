from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import SMTPSetting, EmailTemplate, EmailLog


@admin.register(SMTPSetting)
class SMTPSettingAdmin(admin.ModelAdmin):
    """تنظیمات SMTP در پنل ادمین"""
    
    list_display = ['email', 'host', 'port', 'is_active', 'is_verified', 'is_default', 'display_status']
    list_filter = ['is_active', 'is_verified', 'is_default', 'use_tls']
    search_fields = ['email', 'host', 'display_name', 'name']
    ordering = ['-is_default', '-is_active']
    
    fieldsets = (
        ('اطلاعات پایه', {
            'fields': ('name', 'is_active', 'is_verified', 'is_default')
        }),
        ('تنظیمات SMTP', {
            'fields': ('host', 'port', 'use_tls', 'use_ssl')
        }),
        ('احراز هویت', {
            'fields': ('email', 'password', 'display_name')
        }),
        ('محدودیت‌ها', {
            'fields': ('daily_limit', 'sent_today', 'last_reset')
        }),
        ('آمار', {
            'fields': ('total_sent', 'total_success', 'total_failed'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['sent_today', 'last_reset', 'total_sent', 'total_success', 'total_failed']
    
    actions = ['verify_smtp', 'reset_quota']
    
    def display_status(self, obj):
        status = []
        if obj.is_active:
            status.append('🟢 فعال')
        else:
            status.append('🔴 غیرفعال')
        if obj.is_verified:
            status.append('✅ تایید شده')
        else:
            status.append('❌ تایید نشده')
        if obj.is_default:
            status.append('⭐ پیش‌فرض')
        return ' '.join(status)
    display_status.short_description = 'وضعیت'
    
    def verify_smtp(self, request, queryset):
        from apps.core.utils import test_smtp_connection, decrypt_password
        
        for setting in queryset:
            try:
                password = decrypt_password(setting.password)
                result = test_smtp_connection(
                    setting.email, password,
                    setting.host, setting.port
                )
                if result['success']:
                    setting.is_verified = True
                    setting.save()
                    self.message_user(request, f"✅ SMTP verified for {setting.email}")
                else:
                    self.message_user(request, f"❌ SMTP failed for {setting.email}: {result.get('error', 'Unknown error')}")
            except Exception as e:
                self.message_user(request, f"❌ Error: {e}")
    verify_smtp.short_description = "🔌 تست اتصال SMTP"
    
    def reset_quota(self, request, queryset):
        queryset.update(sent_today=0)
        self.message_user(request, "✅ Quota reset successfully")
    reset_quota.short_description = "🔄 ریست سهمیه روزانه"


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    """قالب‌های ایمیل در پنل ادمین"""
    
    list_display = ['name', 'template_type', 'subject', 'is_active', 'preview_button']
    list_filter = ['template_type', 'is_active']
    search_fields = ['name', 'subject', 'body']
    
    fieldsets = (
        ('اطلاعات پایه', {
            'fields': ('name', 'template_type', 'is_active')
        }),
        ('محتوای ایمیل', {
            'fields': ('subject', 'body')
        }),
        ('راهنما', {
            'fields': ('variables',),
            'classes': ('collapse',),
            'description': 'متغیرهای قابل استفاده در متن و موضوع: {{username}}, {{email}}, {{code}}, {{reset_link}}, {{site_name}}'
        }),
    )
    
    def preview_button(self, obj):
        return format_html(
            '<a href="#" onclick="alert(`موضوع: {0}\n\nمتن: {1}`)" class="button">👁️ پیش‌نمایش</a>',
            obj.subject, obj.body[:200] + '...' if len(obj.body) > 200 else obj.body
        )
    preview_button.short_description = 'پیش‌نمایش'
    
    def save_model(self, request, obj, form, change):
        # راهنمای متغیرها
        variables = {
            'verification': '{{username}}, {{email}}, {{code}}, {{site_name}}',
            'reset_password': '{{username}}, {{email}}, {{code}}, {{reset_link}}, {{site_name}}',
            'welcome': '{{username}}, {{email}}, {{site_name}}',
            'campaign': '{{username}}, {{email}}, {{campaign_name}}, {{site_name}}',
        }
        obj.variables = variables.get(obj.template_type, '')
        super().save_model(request, obj, form, change)


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    """لاگ ارسال ایمیل در پنل ادمین"""
    
    list_display = ['recipient', 'subject', 'status', 'created_at', 'sent_at']
    list_filter = ['status', 'created_at']
    search_fields = ['recipient', 'subject', 'error_message']
    readonly_fields = ['created_at', 'sent_at']
    
    fieldsets = (
        ('اطلاعات ارسال', {
            'fields': ('recipient', 'subject', 'status')
        }),
        ('جزئیات', {
            'fields': ('template', 'smtp_setting', 'error_message')
        }),
        ('زمان', {
            'fields': ('created_at', 'sent_at'),
            'classes': ('collapse',)
        }),
    )