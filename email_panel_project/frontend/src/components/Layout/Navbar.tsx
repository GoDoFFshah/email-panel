import React, { useState, useEffect, useRef } from 'react'
import { Bars3Icon, BellIcon, SunIcon, MoonIcon, LanguageIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-toastify'
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns'
import { fa } from 'date-fns/locale'

interface Notification {
  id: string
  title: string
  message: string
  notification_type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  created_at: string
  link?: string
  icon?: string
}

interface NavbarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { theme, toggleTheme } = useTheme()
  const { language, toggleLanguage, t } = useLanguage()
  const { user } = useAuth()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // دریافت اعلان‌ها از بک‌اند
  const fetchNotifications = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const response = await axios.get('/api/notifications/')
      const data = response.data.results || response.data
      setNotifications(data)
      const unread = data.filter((n: Notification) => !n.is_read).length
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // علامت‌گذاری یک اعلان به عنوان خوانده شده
  const markAsRead = async (id: string) => {
    try {
      await axios.post(`/api/notifications/${id}/read/`)
      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
      toast.error(t('error_occurred'))
    }
  }

  // علامت‌گذاری همه به عنوان خوانده شده
  const markAllAsRead = async () => {
    try {
      await axios.post('/api/notifications/mark-all-read/')
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
      toast.success(t('mark_all_read') || 'همه اعلان‌ها خوانده شدند')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error(t('error_occurred'))
    }
  }

  // حذف یک اعلان
  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`/api/notifications/${id}/`)
      setNotifications(prev => prev.filter(n => n.id !== id))
      const remainingUnread = notifications.filter(n => n.id !== id && !n.is_read).length
      setUnreadCount(remainingUnread)
      toast.success(t('delete_notification') || 'اعلان حذف شد')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error(t('error_occurred'))
    }
  }

  // بستن dropdown با کلیک خارج
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // دریافت اعلان‌ها هر ۳۰ ثانیه
  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return '📌'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500'
      case 'warning': return 'border-yellow-500'
      case 'error': return 'border-red-500'
      default: return 'border-blue-500'
    }
  }

  return (
    <header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-white hidden sm:block">
            {user?.first_name ? `${t('welcome')}, ${user.first_name}` : t('dashboard')}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
            title={language === 'fa' ? 'English' : 'فارسی'}
          >
            <LanguageIcon className="w-5 h-5" />
            <span className="text-xs mr-1">{language === 'fa' ? 'FA' : 'EN'}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
          >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(!isOpen)
              }}
              className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white relative"
              aria-label={t('notifications')}
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Notifications */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden z-50">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-700">
                  <span className="text-white font-medium">
                    🔔 {t('notifications')}
                    {unreadCount > 0 && (
                      <span className="text-xs text-gray-400 mr-2">
                        ({unreadCount} {t('new') || 'جدید'})
                      </span>
                    )}
                  </span>
                  <div className="flex gap-2">
                    {notifications.length > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {t('mark_all_read')}
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {loading && notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      ⏳ {t('loading')}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      📭 {t('no_notifications')}
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${
                          !notif.is_read ? 'bg-blue-500/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{getIcon(notif.notification_type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${!notif.is_read ? 'text-white' : 'text-gray-400'}`}>
                                {notif.title}
                              </p>
                              <button
                                onClick={() => deleteNotification(notif.id)}
                                className="text-gray-500 hover:text-red-400 transition-colors ml-2"
                              >
                                <XMarkIcon className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {notif.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(notif.created_at), {
                                  addSuffix: true,
                                  locale: language === 'fa' ? fa : undefined
                                })}
                              </span>
                              {!notif.is_read && (
                                <button
                                  onClick={() => markAsRead(notif.id)}
                                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  {t('mark_as_read')}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`mt-1 h-0.5 w-full rounded ${getTypeColor(notif.notification_type)}`}></div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-2 border-t border-gray-700 text-center">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      {t('view_all') || 'مشاهده همه'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}