import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

interface Notification {
  id: string
  title: string
  message: string
  notification_type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  created_at: string
  link?: string
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications/')
      const data = response.data.results || response.data
      setNotifications(data)
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await axios.post(`/api/notifications/${id}/read/`)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      toast.error('خطا در علامت‌گذاری')
    }
  }

  const markAllAsRead = async () => {
    try {
      await axios.post('/api/notifications/mark-all-read/')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      toast.success('همه اعلان‌ها خوانده شدند')
    } catch (error) {
      toast.error('خطا در علامت‌گذاری همه')
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`/api/notifications/${id}/`)
      setNotifications(prev => prev.filter(n => n.id !== id))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      toast.error('خطا در حذف اعلان')
    }
  }

  const addNotification = (notification: Partial<Notification>) => {
    // برای افزودن اعلان جدید (مثلاً از WebSocket)
    // اینجا می‌تونه API call باشه
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  }
}