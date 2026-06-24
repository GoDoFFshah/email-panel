export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  user_type: 'user' | 'admin' | 'super_admin'
  account_status: 'active' | 'suspended' | 'banned' | 'pending'
  language: 'fa' | 'en'
  theme: 'dark' | 'light'
  daily_quota: number
  total_sent: number
  total_success: number
  total_failed: number
  is_suspicious: boolean
  joined_date: string
  last_activity: string
}

export interface Sender {
  id: string
  email: string
  display_name: string
  smtp_host: string
  smtp_port: number
  smtp_use_tls: boolean
  is_active: boolean
  is_verified: boolean
  is_primary: boolean
  daily_limit: number
  sent_today: number
  remaining_quota: number
  total_sent: number
  total_success: number
  total_failed: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  description: string
  emails: string[]
  email_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  subject: string
  body: string
  body_html: string
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'paused'
  priority_mode: 'smart' | 'never_sent' | 'oldest' | 'random' | 'sequential'
  scheduled_for: string | null
  started_at: string | null
  completed_at: string | null
  total_recipients: number
  sent_count: number
  success_count: number
  failed_count: number
  open_count: number
  click_count: number
  senders: Sender[]
  categories: string[]
  recipients: string[]
  pending_recipients: string[]
  attachment: string | null
  progress: number
  created_at: string
  updated_at: string
}

export interface EmailSend {
  id: string
  campaign: string
  sender: string
  recipient_email: string
  recipient_name: string
  subject: string
  body: string
  status: 'pending' | 'sending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
  error_message: string | null
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  tracking_id: string | null
  created_at: string
}

export interface RecipientTracking {
  id: string
  email: string
  name: string
  first_sent: string | null
  last_sent: string | null
  total_sent: number
  total_opened: number
  total_clicked: number
  total_bounced: number
  categories: string[]
  is_active: boolean
  is_subscribed: boolean
  is_bounced: boolean
  priority_score: number
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  username: string
  user_email: string
  action: string
  details: Record<string, any>
  ip_address: string
  timestamp: string
}

export interface DashboardStats {
  total_quota: number
  used_quota: number
  remaining_quota: number
  total_campaigns: number
  active_campaigns: number
  total_sends: number
  total_failed: number
  success_rate: number
  total_categories: number
  total_emails: number
  sends_today: number
  chart_data: Array<{ date: string; count: number }>
  recent_activity: ActivityLog[]
}

export interface AdminStats {
  users: {
    total: number
    active: number
    banned: number
    new_this_week: number
  }
  emails: {
    total_campaigns: number
    total_sends: number
    success_sends: number
    failed_sends: number
    sent_today: number
    success_rate: number
  }
  senders: {
    total: number
    active: number
  }
  categories: {
    total: number
    total_emails: number
  }
  security: {
    suspicious_users: number
    failed_logins_today: number
  }
  timestamp: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  password_confirm?: string
  first_name?: string
  last_name?: string
}

export interface ChangePasswordData {
  old_password: string
  new_password: string
  new_password_confirm: string
}

export interface SendEmailData {
  subject: string
  body: string
  body_html?: string
  recipient_type: 'single' | 'category' | 'all'
  recipients?: string[]
  category?: string
  priority_mode: 'smart' | 'never_sent' | 'oldest' | 'random' | 'sequential'
  sender_ids?: string[]
  schedule_for?: string
}