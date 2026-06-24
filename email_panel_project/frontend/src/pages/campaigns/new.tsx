import React, { useState, useRef } from 'react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { useRouter } from 'next/router'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'react-toastify'
import { api } from '@/utils/api'
import { useDropzone } from 'react-dropzone'
import { PaperClipIcon, XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline'

export default function NewCampaignPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
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
  })

  // ==================== مدیریت گیرنده‌ها ====================

  // اضافه کردن گیرنده از متن
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

    // بررسی ایمیل‌های تکراری
    const newEmails = emails.filter(e => !recipients.includes(e))
    if (newEmails.length === 0) {
      toast.warning('همه ایمیل‌ها قبلاً اضافه شده‌اند')
      return
    }

    setRecipients([...recipients, ...newEmails])
    setRecipientInput('')
    toast.success(`${newEmails.length} ایمیل جدید اضافه شد`)
  }

  // حذف یک گیرنده
  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email))
  }

  // پاک کردن همه گیرنده‌ها
  const clearAllRecipients = () => {
    if (recipients.length === 0) return
    if (confirm('آیا از حذف همه گیرنده‌ها مطمئن هستید؟')) {
      setRecipients([])
      toast.info('همه گیرنده‌ها حذف شدند')
    }
  }

  // ==================== مدیریت فایل ====================

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
          // پردازش JSON
          const data = JSON.parse(content)
          if (Array.isArray(data)) {
            emails = data.map(item => item.email || item).filter((e: string) => e && e.includes('@'))
          } else if (data.emails && Array.isArray(data.emails)) {
            emails = data.emails.filter((e: string) => e && e.includes('@'))
          } else {
            emails = Object.values(data).filter((e: any) => typeof e === 'string' && e.includes('@'))
          }
        } else {
          // پردازش TXT یا CSV
          emails = content
            .split(/[\n,;]/)
            .map(e => e.trim().replace(/^["']|["']$/g, ''))
            .filter(e => e && e.includes('@'))
        }

        if (emails.length === 0) {
          toast.error('هیچ ایمیل معتبری در فایل یافت نشد')
          return
        }

        // اضافه کردن ایمیل‌های جدید
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
    setLoading(true)

    try {
      // اعتبارسنجی
      if (!formData.name.trim()) {
        toast.error('نام کمپین الزامی است')
        setLoading(false)
        return
      }
      if (!formData.subject.trim()) {
        toast.error('موضوع ایمیل الزامی است')
        setLoading(false)
        return
      }
      if (!formData.body.trim()) {
        toast.error('متن ایمیل الزامی است')
        setLoading(false)
        return
      }

      // ارسال به API
      const response = await api.post('/emails/campaigns/', {
        name: formData.name,
        subject: formData.subject,
        body: formData.body,
        body_html: formData.body_html || '',
        priority_mode: formData.priority_mode,
        recipients: recipients, // ✅ ارسال گیرنده‌ها به سرور
      })

      toast.success(`✅ کمپین "${formData.name}" با ${recipients.length} گیرنده ایجاد شد!`)
      router.push('/campaigns')
    } catch (error: any) {
      console.error('Error creating campaign:', error)
      
      if (error.response?.data) {
        const errors = error.response.data
        if (typeof errors === 'object') {
          const messages = Object.values(errors).flat().join('\n')
          toast.error(messages || 'خطا در ایجاد کمپین')
        } else {
          toast.error(errors || 'خطا در ایجاد کمپین')
        }
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('خطا در ارتباط با سرور')
      } else {
        toast.error('خطا: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{t('create_campaign')}</h1>
          <button
            onClick={() => router.push('/campaigns')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
          >
            ← {t('back_to_list')}
          </button>
        </div>

        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* نام کمپین */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('campaign_name')} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder={t('campaign_name_placeholder')}
                required
              />
            </div>

            {/* موضوع ایمیل */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('subject')} *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder={t('subject_placeholder')}
                required
              />
            </div>

            {/* متن ایمیل */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('body')} *
              </label>
              <textarea
                name="body"
                rows={6}
                value={formData.body}
                onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder={t('body_placeholder')}
                required
              />
            </div>

            {/* اولویت */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('priority')}
              </label>
              <select
                name="priority_mode"
                value={formData.priority_mode}
                onChange={handleChange}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="smart">🧠 {t('smart_priority')}</option>
                <option value="never_sent">🆕 {t('never_sent')}</option>
                <option value="oldest">📅 {t('oldest_first')}</option>
                <option value="random">🎲 {t('random')}</option>
                <option value="sequential">📋 {t('sequential')}</option>
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
                  placeholder="ایمیل‌ها را وارد کنید (هر خط یک ایمیل)&#10;مثال:&#10;user1@gmail.com&#10;user2@yahoo.com"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleAddRecipients}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm transition-colors flex items-center gap-1"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  اضافه کردن ایمیل‌ها
                </button>

                {/* آپلود فایل */}
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
                disabled={loading}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-700 rounded-lg text-white transition-colors"
              >
                {loading ? '⏳ در حال ذخیره...' : `💾 ذخیره کمپین (${recipients.length} گیرنده)`}
              </button>
              <button
                type="button"
                onClick={() => router.push('/campaigns')}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}