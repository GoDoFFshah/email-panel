import React, { useState, useEffect, useRef } from 'react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { useRouter } from 'next/router'
import { useLanguage } from '@/contexts/LanguageContext'
import { api } from '@/utils/api'
import { toast } from 'react-toastify'
import { XMarkIcon, UserPlusIcon, PaperClipIcon } from '@heroicons/react/24/outline'

export default function EditCampaignPage() {
  const router = useRouter()
  const { id } = router.query
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [recipientInput, setRecipientInput] = useState('')
  const [recipients, setRecipients] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    body_html: '',
    priority_mode: 'smart',
    status: 'draft',
  })

  useEffect(() => {
    if (id) {
      fetchCampaign()
    }
  }, [id])

  const fetchCampaign = async () => {
    try {
      const response = await api.get(`/emails/campaigns/${id}/`)
      const data = response.data
      setFormData({
        name: data.name || '',
        subject: data.subject || '',
        body: data.body || '',
        body_html: data.body_html || '',
        priority_mode: data.priority_mode || 'smart',
        status: data.status || 'draft',
      })
      // ✅ دریافت گیرنده‌ها
      setRecipients(data.recipients || [])
    } catch (error) {
      console.error('Error fetching campaign:', error)
      toast.error('خطا در دریافت اطلاعات کمپین')
      router.push('/campaigns')
    } finally {
      setLoading(false)
    }
  }

  // ==================== مدیریت گیرنده‌ها ====================

  const handleAddRecipients = () => {
    if (!recipientInput.trim()) {
      toast.warning('لطفاً حداقل یک ایمیل وارد کنید')
      return
    }

    const emails = recipientInput
      .split('\n')
      .map(e => e.trim())
      .filter(e => e && e.includes('@'))

    if (emails.length === 0) {
      toast.error('ایمیل معتبری یافت نشد')
      return
    }

    const newEmails = emails.filter(e => !recipients.includes(e))
    if (newEmails.length === 0) {
      toast.warning('همه ایمیل‌ها قبلاً اضافه شده‌اند')
      return
    }

    setRecipients([...recipients, ...newEmails])
    setRecipientInput('')
    toast.success(`${newEmails.length} ایمیل جدید اضافه شد`)
  }

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email))
  }

  const clearAllRecipients = () => {
    if (recipients.length === 0) return
    if (confirm('آیا از حذف همه گیرنده‌ها مطمئن هستید؟')) {
      setRecipients([])
      toast.info('همه گیرنده‌ها حذف شدند')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['text/plain', 'text/csv', 'application/json']
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      toast.error('فایل باید از نوع txt، csv یا json باشد')
      return
    }

    setFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        let emails: string[] = []

        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content)
          if (Array.isArray(data)) {
            emails = data.map(item => item.email || item).filter((e: string) => e && e.includes('@'))
          } else if (data.emails && Array.isArray(data.emails)) {
            emails = data.emails.filter((e: string) => e && e.includes('@'))
          } else {
            emails = Object.values(data).filter((e: any) => typeof e === 'string' && e.includes('@'))
          }
        } else {
          emails = content
            .split(/[\n,;]/)
            .map(e => e.trim().replace(/^["']|["']$/g, ''))
            .filter(e => e && e.includes('@'))
        }

        if (emails.length === 0) {
          toast.error('هیچ ایمیل معتبری در فایل یافت نشد')
          return
        }

        const newEmails = emails.filter(e => !recipients.includes(e))
        if (newEmails.length === 0) {
          toast.warning('همه ایمیل‌های فایل قبلاً اضافه شده‌اند')
          return
        }

        setRecipients([...recipients, ...newEmails])
        toast.success(`${newEmails.length} ایمیل از فایل اضافه شد`)
        setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } catch (error) {
        toast.error('خطا در خواندن فایل')
        console.error(error)
      }
    }
    reader.readAsText(file)
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ==================== فرم ====================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await api.put(`/emails/campaigns/${id}/`, {
        ...formData,
        recipients: recipients, // ✅ ارسال گیرنده‌ها به سرور
      })

      toast.success(`✅ کمپین "${formData.name}" با ${recipients.length} گیرنده به‌روزرسانی شد!`)
      
      // اگر کمپین در حالت draft یا paused بود، می‌تونه دوباره ارسال کنه
      if (formData.status === 'draft' || formData.status === 'paused') {
        toast.info('💡 می‌توانید با کلیک روی دکمه "ارسال" در صفحه لیست، کمپین را دوباره ارسال کنید.')
      }
      
      router.push(`/campaigns/${id}`)
    } catch (error: any) {
      console.error('Error updating campaign:', error)
      toast.error('خطا در به‌روزرسانی کمپین')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-400">{t('loading')}</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">✏️ ویرایش کمپین</h1>
          <button
            onClick={() => router.push(`/campaigns/${id}`)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
          >
            ← بازگشت
          </button>
        </div>

        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* نام کمپین */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                نام کمپین *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {/* موضوع ایمیل */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                موضوع ایمیل *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {/* متن ایمیل */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                متن ایمیل *
              </label>
              <textarea
                name="body"
                rows={6}
                value={formData.body}
                onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {/* اولویت */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                اولویت ارسال
              </label>
              <select
                name="priority_mode"
                value={formData.priority_mode}
                onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="smart">🧠 اولویت هوشمند</option>
                <option value="never_sent">🆕 هرگز ارسال نشده</option>
                <option value="oldest">📅 قدیمی‌ترین اولویت</option>
                <option value="random">🎲 تصادفی</option>
                <option value="sequential">📋 ترتیبی</option>
              </select>
            </div>

            {/* وضعیت */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                وضعیت
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="draft">📝 پیش‌نویس</option>
                <option value="scheduled">📅 برنامه‌ریزی شده</option>
                <option value="paused">⏸ متوقف شده</option>
              </select>
            </div>

            {/* ==================== بخش گیرنده‌ها ==================== */}
            <div className="border-t border-gray-700/50 pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300">
                  👥 گیرنده‌ها ({recipients.length})
                </label>
                {recipients.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllRecipients}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    🗑️ حذف همه
                  </button>
                )}
              </div>

              {/* ورودی متن */}
              <div className="flex gap-2">
                <textarea
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  placeholder="ایمیل‌ها را وارد کنید (هر خط یک ایمیل)"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 mt-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleAddRecipients}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm transition-colors flex items-center gap-1"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  اضافه کردن ایمیل‌ها
                </button>

                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.csv,.json"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors flex items-center gap-1"
                  >
                    <PaperClipIcon className="w-4 h-4" />
                    آپلود فایل
                  </button>
                </div>

                {file && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                    <span>📎 {file.name}</span>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-red-400 hover:text-red-300"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* لیست گیرنده‌ها */}
              {recipients.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-800/30 rounded-lg">
                  {recipients.map((email) => (
                    <span
                      key={email}
                      className="flex items-center gap-1 bg-gray-700/50 px-3 py-1 rounded-full text-sm text-gray-300"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeRecipient(email)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* دکمه‌ها */}
            <div className="flex gap-3 pt-4 border-t border-gray-700/50">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-700 rounded-lg text-white transition-colors"
              >
                {saving ? '⏳ در حال ذخیره...' : `💾 ذخیره تغییرات (${recipients.length} گیرنده)`}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/campaigns/${id}`)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
              >
                {t('cancel')}
              </button>
            </div>

            {/* راهنمای ارسال مجدد */}
            {formData.status === 'draft' || formData.status === 'paused' ? (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-sm">
                  💡 پس از ذخیره تغییرات، می‌توانید از صفحه لیست کمپین‌ها، 
                  روی دکمه <strong>"ارسال"</strong> کلیک کنید تا کمپین دوباره ارسال شود.
                </p>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  ⚠️ این کمپین در حال ارسال یا تکمیل شده است. برای ارسال مجدد، 
                  وضعیت را به <strong>"پیش‌نویس"</strong> یا <strong>"متوقف شده"</strong> تغییر دهید.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </MainLayout>
  )
}