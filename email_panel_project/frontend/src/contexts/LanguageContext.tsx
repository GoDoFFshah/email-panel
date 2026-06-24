import React, { createContext, useContext, useState, useEffect } from 'react'

interface LanguageContextType {
  language: 'fa' | 'en'
  toggleLanguage: () => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

const translations = {
  fa: {
    // ==================== GENERAL ====================
    'welcome': 'خوش آمدید',
    'dashboard': 'داشبورد',
    'campaigns': 'کمپین‌ها',
    'senders': 'فرستنده‌ها',
    'categories': 'دسته‌بندی‌ها',
    'analytics': 'تحلیل‌ها',
    'settings': 'تنظیمات',
    'admin_panel': 'پنل مدیریت',
    'logout': 'خروج',
    'login': 'ورود',
    'register': 'ثبت‌نام',
    'search': 'جستجو...',
    'loading': 'در حال بارگذاری...',
    'error_occurred': 'خطایی رخ داد',
    'success': 'موفق',
    'failed': 'ناموفق',
    'pending': 'در انتظار',
    'send_again': 'ارسال مجدد',
    'sending': 'در حال ارسال',
    'completed': 'تکمیل شد',
    'scheduled': 'برنامه‌ریزی شده',
    'draft': 'پیش‌نویس',
    'paused': 'متوقف شده',
    'subject': 'موضوع',
    'body': 'متن',
    'recipients': 'گیرنده‌ها',
    'priority': 'اولویت',
    'attachment': 'ضمیمه',
    'schedule': 'برنامه‌ریزی',
    'cancel': 'لغو',
    'save': 'ذخیره',
    'delete': 'حذف',
    'edit': 'ویرایش',
    'view': 'مشاهده',
    'confirm': 'تأیید',
    'are_you_sure': 'آیا مطمئن هستید؟',
    'yes': 'بله',
    'no': 'خیر',
    'create': 'ایجاد',
    'add': 'افزودن',
    'send': 'ارسال',
    'pause': 'توقف',
    'resume': 'ادامه',
    'test': 'تست',
    'new': 'جدید',
    'view_all': 'مشاهده همه',
    'total_sends': 'کل ارسال‌ها',
    'active_recipients': 'گیرنده‌های فعال',
    'success_rate': 'نرخ موفقیت',
    'quota_remaining': 'سهمیه باقیمانده',
    'recent_activity': 'فعالیت‌های اخیر',
    'no_activity': 'هیچ فعالیتی وجود ندارد',
    'email_activity': 'فعالیت ایمیل',
    'send_status': 'وضعیت ارسال',
    'create_campaign': 'ایجاد کمپین جدید',
    'send_email': 'ارسال ایمیل',
    'add_sender': 'افزودن فرستنده',
    'add_category': 'افزودن دسته‌بندی',
    'back_to_list': 'بازگشت به لیست',
    'no_senders': 'هیچ فرستنده‌ای وجود ندارد',
    'back': 'بازگشت',
    'campaign_updated': 'کمپین با موفقیت به‌روزرسانی شد!',
    'edit_campaign': 'ویرایش کمپین',
    'total_recipients': 'تعداد گیرنده‌ها',
    'sent_count': 'ارسال شده',
    'success_count': 'موفق',
    'failed_count': 'ناموفق',
    'created_at': 'تاریخ ایجاد',
    'campaign_details': 'جزئیات کمپین',
    'used_quota': 'استفاده شده',
    'weekly_chart': 'نمودار هفتگی',
    'total_quota': 'سهمیه کل',
    'remaining_quota': 'سهمیه باقیمانده',
    'total_campaigns': 'تعداد کمپین‌ها',
    'quota_details': 'جزئیات سهمیه',
    'sign_in': 'ورود',
    'forgot_password': 'رمز عبور را فراموش کرده‌اید؟',
    'remember_me': 'مرا به خاطر بسپار',
    'dont_have_account': 'حساب کاربری ندارید؟',
    'already_have_account': 'قبلاً ثبت‌نام کرده‌اید؟',
    'sign_up': 'ثبت‌نام',
    'username_required': 'نام کاربری الزامی است',
    'password_required': 'رمز عبور الزامی است',

    // ==================== SENDERS ====================
    'sender_active_verified': '✅ فعال و تایید شده',
    'sender_active_unverified': '⚠️ فعال ولی تست نشده',
    'sender_inactive': '❌ غیرفعال',
    'senders_description': 'مدیریت فرستنده‌های SMTP',
    'no_senders_found': 'هیچ فرستنده‌ای اضافه نشده است',
    'add_sender_description': 'برای شروع، روی دکمه "افزودن فرستنده جدید" کلیک کنید',
    'sender_email': 'ایمیل فرستنده',
    'sender_password': 'رمز عبور (App Password)',
    'sender_display_name': 'نام نمایشی',
    'sender_email_placeholder': 'example@gmail.com',
    'sender_password_placeholder': '۱۶ رقمی از Google App Password',
    'sender_display_name_placeholder': 'اختیاری',
    'sender_primary': 'اصلی',
    'sender_verified': 'تایید شده',
    'sender_active': 'فعال',
    'sender_inactive': 'غیرفعال',
    'sender_quota': 'سهمیه',
    'sender_remaining': 'باقیمانده',
    'test_connection': 'تست اتصال',
    'toggle_status': 'تغییر وضعیت',
    'delete_sender': 'حذف فرستنده',
    'sender_added': 'فرستنده با موفقیت اضافه شد',
    'sender_deleted': 'فرستنده حذف شد',
    'sender_toggled': 'وضعیت فرستنده تغییر کرد',
    'sender_tested_success': 'اتصال SMTP با موفقیت برقرار شد',
    'sender_tested_failed': 'خطا در اتصال SMTP',

    // ==================== CAMPAIGNS ====================
    'campaigns_description': 'مدیریت کمپین‌های ارسال ایمیل',
    'no_campaigns': 'هیچ کمپینی وجود ندارد',
    'create_campaign_description': 'برای شروع، روی دکمه "ایجاد کمپین جدید" کلیک کنید',
    'campaign_name': 'نام کمپین',
    'campaign_name_placeholder': 'مثلاً: کمپین ویژه نوروز',
    'subject_placeholder': 'موضوع ایمیل را وارد کنید...',
    'body_placeholder': 'متن ایمیل را وارد کنید (پشتیبانی از HTML)...',
    'smart_priority': 'اولویت هوشمند',
    'never_sent': 'هرگز ارسال نشده',
    'oldest_first': 'قدیمی‌ترین اولویت',
    'random': 'تصادفی',
    'sequential': 'ترتیبی',
    'saving': 'در حال ذخیره...',
    'campaign_created': 'کمپین با موفقیت ایجاد شد',
    'campaign_status': 'وضعیت کمپین',
    'campaign_completed': 'کمپین شما با موفقیت ارسال شد',
    'welcome_message': 'به پنل خوش آمدید',

    // ==================== CATEGORIES ====================
    'categories_description': 'مدیریت دسته‌بندی‌های مخاطبین',
    'no_categories': 'هیچ دسته‌بندی وجود ندارد',
    'create_category': 'ساخت دسته جدید',
    'add_emails': 'اضافه کردن ایمیل',
    'category_name': 'نام دسته‌بندی',
    'category_name_placeholder': 'مثلاً: مشتریان ویژه',
    'category_created': 'دسته‌بندی با موفقیت ایجاد شد',
    'category_deleted': 'دسته‌بندی حذف شد',
    'emails_added': 'ایمیل‌ها با موفقیت اضافه شدند',
    'import_from_file': 'وارد کردن از فایل',
    'export_txt': 'خروجی txt',
    'category_empty': 'دسته‌بندی خالی است',
    'category_emails_count': 'تعداد ایمیل‌ها',

    // ==================== ANALYTICS ====================
    'analytics_description': 'گزارش‌ها و آمار',
    'total_senders_count': 'کل فرستنده‌ها',
    'total_categories_count': 'کل دسته‌بندی‌ها',
    'today_sends': 'ارسال‌های امروز',
    'send_distribution': 'توزیع ارسال‌ها',

    // ==================== NOTIFICATIONS ====================
    'notifications': 'اعلان‌ها',
    'no_notifications': 'هیچ اعلانی وجود ندارد',
    'mark_all_read': 'همه خوانده شد',
    'mark_as_read': 'خوانده شد',
    'delete_notification': 'حذف اعلان',
    'notification_types': {
      'info': 'اطلاعاتی',
      'success': 'موفقیت',
      'warning': 'هشدار',
      'error': 'خطا',
    },

    // ==================== ERRORS ====================
    'login_failed': 'ورود ناموفق بود',
    'register_failed': 'ثبت‌نام ناموفق بود',
    'invalid_credentials': 'نام کاربری یا رمز عبور اشتباه است',
    'network_error': 'مشکل در ارتباط با سرور',
    'unauthorized': 'شما دسترسی ندارید',
    'not_found': 'صفحه مورد نظر یافت نشد',

    // ==================== AUTH ====================
    'username': 'نام کاربری',
    'password': 'رمز عبور',
    'email': 'ایمیل',
    'first_name': 'نام',
    'last_name': 'نام خانوادگی',
    'username_placeholder': 'نام کاربری خود را وارد کنید',
    'password_placeholder': 'رمز عبور خود را وارد کنید',
    'email_placeholder': 'ایمیل خود را وارد کنید',
    'confirm_password': 'تأیید رمز عبور',
    'password_mismatch': 'رمز عبور با تأیید آن مطابقت ندارد',
    'password_min_length': 'رمز عبور باید حداقل ۸ کاراکتر باشد',
  },
  en: {
    // ==================== GENERAL ====================
    'welcome': 'Welcome',
    'dashboard': 'Dashboard',
    'campaigns': 'Campaigns',
    'senders': 'Senders',
    'categories': 'Categories',
    'analytics': 'Analytics',
    'settings': 'Settings',
    'admin_panel': 'Admin Panel',
    'logout': 'Logout',
    'login': 'Login',
    'register': 'Register',
    'search': 'Search...',
    'loading': 'Loading...',
    'error_occurred': 'An error occurred',
    'success': 'Success',
    'failed': 'Failed',
    'pending': 'Pending',
    'sending': 'Sending',
    'completed': 'Completed',
    'scheduled': 'Scheduled',
    'draft': 'Draft',
    'paused': 'Paused',
    'subject': 'Subject',
    'body': 'Body',
    'recipients': 'Recipients',
    'priority': 'Priority',
    'attachment': 'Attachment',
    'schedule': 'Schedule',
    'cancel': 'Cancel',
    'save': 'Save',
    'delete': 'Delete',
    'edit': 'Edit',
    'view': 'View',
    'confirm': 'Confirm',
    'are_you_sure': 'Are you sure?',
    'yes': 'Yes',
    'no': 'No',
    'create': 'Create',
    'add': 'Add',
    'send': 'Send',
    'stop': 'Stop',
    'resume': 'Resume',
    'test': 'Test',
    'new': 'New',
    'view_all': 'View All',
    'total_sends': 'Total Sends',
    'active_recipients': 'Active Recipients',
    'success_rate': 'Success Rate',
    'quota_remaining': 'Quota Remaining',
    'recent_activity': 'Recent Activity',
    'no_activity': 'No recent activity',
    'email_activity': 'Email Activity',
    'send_status': 'Send Status',
    'create_campaign': 'Create New Campaign',
    'send_email': 'Send Email',
    'add_sender': 'Add Sender',
    'add_category': 'Add Category',
    'back_to_list': 'Back to list',
    'no_senders': 'No senders found',
    'back': 'Back',
    'campaign_updated': 'Campaign updated successfully!',
    'edit_campaign': 'Edit Campaign',
    'total_recipients': 'Total Recipients',
    'sent_count': 'Sent',
    'success_count': 'Success',
    'failed_count': 'Failed',
    'created_at': 'Created At',
    'campaign_details': 'Campaign Details',
    'used_quota': 'Used',
    'weekly_chart': 'Weekly Chart',
    'total_quota': 'Total Quota',
    'remaining_quota': 'Remaining Quota',
    'total_campaigns': 'Total Campaigns',
    'quota_details': 'Quota Details',
    'sign_in': 'Sign In',
    'forgot_password': 'Forgot password?',
    'remember_me': 'Remember me',
    'dont_have_account': "Don't have an account?",
    'already_have_account': 'Already have an account?',
    'sign_up': 'Sign Up',
    'username_required': 'Username is required',
    'password_required': 'Password is required',

    // ==================== SENDERS ====================
    'sender_active_verified': '✅ Active & Verified',
    'sender_active_unverified': '⚠️ Active but not tested',
    'sender_inactive': '❌ Inactive',
    'senders_description': 'Manage SMTP senders',
    'no_senders_found': 'No senders added yet',
    'add_sender_description': 'Click "Add Sender" to get started',
    'sender_email': 'Sender Email',
    'sender_password': 'Password (App Password)',
    'sender_display_name': 'Display Name',
    'sender_email_placeholder': 'example@gmail.com',
    'sender_password_placeholder': '16-character Google App Password',
    'sender_display_name_placeholder': 'Optional',
    'sender_primary': 'Primary',
    'sender_verified': 'Verified',
    'sender_active': 'Active',
    'sender_inactive': 'Inactive',
    'sender_quota': 'Quota',
    'sender_remaining': 'Remaining',
    'test_connection': 'Test Connection',
    'toggle_status': 'Toggle Status',
    'delete_sender': 'Delete Sender',
    'sender_added': 'Sender added successfully',
    'sender_deleted': 'Sender deleted',
    'sender_toggled': 'Sender status changed',
    'sender_tested_success': 'SMTP connection successful',
    'sender_tested_failed': 'SMTP connection failed',

    // ==================== CAMPAIGNS ====================
    'campaigns_description': 'Manage email campaigns',
    'no_campaigns': 'No campaigns found',
    'create_campaign_description': 'Click "Create New Campaign" to get started',
    'campaign_name': 'Campaign Name',
    'campaign_name_placeholder': 'e.g: New Year Campaign',
    'subject_placeholder': 'Enter email subject...',
    'body_placeholder': 'Enter email body (HTML supported)...',
    'smart_priority': 'Smart Priority',
    'never_sent': 'Never Sent',
    'oldest_first': 'Oldest First',
    'random': 'Random',
    'sequential': 'Sequential',
    'saving': 'Saving...',
    'campaign_created': 'Campaign created successfully',
    'campaign_status': 'Campaign Status',
    'campaign_completed': 'Your campaign was sent successfully',
    'welcome_message': 'Welcome to the panel',

    // ==================== CATEGORIES ====================
    'categories_description': 'Manage contact categories',
    'no_categories': 'No categories found',
    'create_category': 'Create Category',
    'add_emails': 'Add Emails',
    'category_name': 'Category Name',
    'category_name_placeholder': 'e.g: VIP Customers',
    'category_created': 'Category created successfully',
    'category_deleted': 'Category deleted',
    'emails_added': 'Emails added successfully',
    'import_from_file': 'Import from file',
    'export_txt': 'Export txt',
    'category_empty': 'Category is empty',
    'category_emails_count': 'Total emails',

    // ==================== ANALYTICS ====================
    'analytics_description': 'Reports and statistics',
    'total_senders_count': 'Total Senders',
    'total_categories_count': 'Total Categories',
    'today_sends': "Today's Sends",
    'send_distribution': 'Send Distribution',

    // ==================== NOTIFICATIONS ====================
    'notifications': 'Notifications',
    'no_notifications': 'No notifications',
    'mark_all_read': 'Mark all as read',
    'mark_as_read': 'Mark as read',
    'delete_notification': 'Delete notification',
    'notification_types': {
      'info': 'Info',
      'success': 'Success',
      'warning': 'Warning',
      'error': 'Error',
    },

    // ==================== ERRORS ====================
    'login_failed': 'Login failed',
    'register_failed': 'Registration failed',
    'invalid_credentials': 'Invalid username or password',
    'network_error': 'Network connection error',
    'unauthorized': 'You are not authorized',
    'not_found': 'Page not found',

    // ==================== AUTH ====================
    'username': 'Username',
    'password': 'Password',
    'email': 'Email',
    'first_name': 'First Name',
    'last_name': 'Last Name',
    'username_placeholder': 'Enter your username',
    'password_placeholder': 'Enter your password',
    'email_placeholder': 'Enter your email',
    'confirm_password': 'Confirm Password',
    'password_mismatch': 'Password does not match',
    'password_min_length': 'Password must be at least 8 characters',
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'fa' | 'en'>('fa')

  useEffect(() => {
    const stored = localStorage.getItem('language') as 'fa' | 'en'
    if (stored) {
      setLanguage(stored)
      document.dir = stored === 'fa' ? 'rtl' : 'ltr'
      document.documentElement.lang = stored
    }
  }, [])

  const toggleLanguage = () => {
    const newLang = language === 'fa' ? 'en' : 'fa'
    setLanguage(newLang)
    localStorage.setItem('language', newLang)
    document.dir = newLang === 'fa' ? 'rtl' : 'ltr'
    document.documentElement.lang = newLang
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let result: any = translations[language]
    
    for (const k of keys) {
      if (result && result[k] !== undefined) {
        result = result[k]
      } else {
        let fallback: any = translations.en
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk]
          } else {
            return key
          }
        }
        return fallback
      }
    }
    
    return typeof result === 'string' ? result : key
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}