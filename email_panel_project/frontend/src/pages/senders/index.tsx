import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { useRouter } from 'next/router'
import { useLanguage } from '@/contexts/LanguageContext'
import axios from 'axios'
import { toast } from 'react-toastify'

interface Sender {
  id: string
  email: string
  display_name: string
  is_active: boolean
  is_verified: boolean
  is_primary: boolean
  daily_limit: number
  sent_today: number
  remaining_quota: number
}

export default function SendersPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [senders, setSenders] = useState<Sender[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    display_name: '',
  })

  useEffect(() => {
    fetchSenders()
  }, [])

  const fetchSenders = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/senders/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      let data = []
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          data = response.data
        } else if (response.data.results) {
          data = response.data.results
        }
      }
      
      setSenders(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error('Error fetching senders:', error)
      if (error.response?.status === 401) {
        toast.error(t('error_unauthorized'))
        router.push('/login')
      } else if (error.response?.status === 404) {
        toast.error(t('error_not_found'))
      } else if (error.code === 'ERR_NETWORK') {
        toast.error(t('error_network'))
      } else {
        toast.error(t('error_server'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    if (!formData.email) {
      toast.error(t('error_invalid_email'))
      setSubmitting(false)
      return
    }

    if (!formData.password || formData.password.length < 8) {
      toast.error(t('error_invalid_password'))
      setSubmitting(false)
      return
    }

    try {
      await axios.post('http://localhost:8000/api/senders/', {
        email: formData.email,
        password: formData.password,
        display_name: formData.display_name || formData.email,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      toast.success(t('sender_added') || 'فرستنده با موفقیت اضافه شد')
      setShowModal(false)
      setFormData({ email: '', password: '', display_name: '' })
      fetchSenders()
    } catch (error: any) {
      console.error('Error adding sender:', error)
      
      if (error.response?.status === 400) {
        if (error.response?.data?.error?.includes('already exists')) {
          toast.error(t('error_sender_exists'))
        } else {
          toast.error(t('error_validation'))
        }
      } else if (error.response?.status === 401) {
        toast.error(t('error_unauthorized'))
      } else if (error.code === 'ERR_NETWORK') {
        toast.error(t('error_network'))
      } else {
        toast.error(t('error_server'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  // تست اتصال
  const testSender = async (id: string) => {
    try {
      const response = await axios.post(`http://localhost:8000/api/senders/${id}/test/`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (response.data.success) {
        toast.success('✅ ' + (response.data.message || 'اتصال SMTP با موفقیت برقرار شد'))
      } else {
        toast.error('❌ ' + (response.data.error || 'اتصال SMTP ناموفق بود'))
      }
      fetchSenders()
    } catch (error: any) {
      console.error('Error testing sender:', error)
      
      if (error.response?.data?.error) {
        toast.error('❌ ' + error.response.data.error)
      } else if (error.response?.status === 400) {
        toast.error('❌ خطا در تست اتصال: ایمیل یا رمز عبور اشتباه است')
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('❌ خطا در ارتباط با سرور')
      } else {
        toast.error('❌ خطا در تست اتصال')
      }
      fetchSenders()
    }
  }

  // تغییر وضعیت
  const toggleSender = async (id: string) => {
    try {
      const response = await axios.post(`http://localhost:8000/api/senders/${id}/toggle/`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      toast.success('✅ ' + (response.data.message || 'وضعیت فرستنده تغییر کرد'))
      fetchSenders()
    } catch (error: any) {
      console.error('Error toggling sender:', error)
      
      if (error.response?.data?.error) {
        toast.error('❌ ' + error.response.data.error)
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('❌ خطا در ارتباط با سرور')
      } else {
        toast.error('❌ خطا در تغییر وضعیت')
      }
    }
  }

  const deleteSender = async (id: string) => {
    if (!confirm(t('are_you_sure'))) return
    
    try {
      await axios.delete(`http://localhost:8000/api/senders/${id}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      toast.success(t('sender_deleted') || 'فرستنده حذف شد')
      fetchSenders()
    } catch (error: any) {
      console.error('Error deleting sender:', error)
      if (error.code === 'ERR_NETWORK') {
        toast.error(t('error_network'))
      } else {
        toast.error(t('error_server'))
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // ✅ تابع برای دریافت رنگ وضعیت
  const getStatusColor = (sender: Sender) => {
    if (sender.is_active && sender.is_verified) return 'bg-green-500'
    if (sender.is_active && !sender.is_verified) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // ✅ تابع برای دریافت متن وضعیت
  const getStatusText = (sender: Sender) => {
    if (sender.is_active && sender.is_verified) return t('sender_active_verified')
    if (sender.is_active && !sender.is_verified) return t('sender_active_unverified')
    return t('sender_inactive')
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('senders')}</h1>
            <p className="text-gray-400 text-sm mt-1">{t('senders_description')}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors flex items-center gap-2"
          >
            <span>➕</span> {t('add_sender')}
          </button>
        </div>

        <div className="glass rounded-2xl p-6">
          {loading ? (
            <p className="text-gray-400 text-center py-12">{t('loading')}</p>
          ) : senders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">📭 {t('no_senders_found')}</p>
              <p className="text-gray-500 text-sm mt-2">{t('add_sender_description')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {senders.map((sender) => (
                <div
                  key={sender.id}
                  className="flex flex-wrap items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all"
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(sender)}`}></span>
                      <span className="text-white font-medium">{sender.email}</span>
                      {sender.is_primary && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                          ⭐ {t('sender_primary')}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        sender.is_active && sender.is_verified ? 'bg-green-500/20 text-green-400' :
                        sender.is_active && !sender.is_verified ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {getStatusText(sender)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      📊 {t('sender_quota')}: {sender.sent_today}/{sender.daily_limit} | 
                      🟢 {t('sender_remaining')}: {sender.remaining_quota}
                    </div>
                    {sender.display_name && (
                      <div className="text-sm text-gray-500">👤 {sender.display_name}</div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0 flex-wrap">
                    <button
                      onClick={() => testSender(sender.id)}
                      className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors"
                    >
                      🔌 {t('test_connection')}
                    </button>
                    <button
                      onClick={() => toggleSender(sender.id)}
                      disabled={!sender.is_verified && !sender.is_active}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        sender.is_active
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : sender.is_verified
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                      }`}
                      title={!sender.is_verified && !sender.is_active ? 'ابتدا تست اتصال را انجام دهید' : ''}
                    >
                      {sender.is_active ? '🔴 ' + t('sender_inactive') : '🟢 ' + t('sender_active')}
                    </button>
                    <button
                      onClick={() => deleteSender(sender.id)}
                      className="px-3 py-1 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                    >
                      🗑️ {t('delete_sender')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal اضافه کردن فرستنده */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700/50">
            <h2 className="text-xl font-bold text-white mb-4">➕ {t('add_sender')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  📧 {t('sender_email')} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder={t('sender_email_placeholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  🔑 {t('sender_password')} *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder={t('sender_password_placeholder')}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  👤 {t('sender_display_name')}
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder={t('sender_display_name_placeholder')}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-700 rounded-lg text-white transition-colors"
                >
                  {submitting ? '⏳ ' + t('loading') : '💾 ' + t('save')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                >
                  ❌ {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  )
}