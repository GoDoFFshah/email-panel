import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { useRouter } from 'next/router'
import { useLanguage } from '@/contexts/LanguageContext'
import { api } from '@/utils/api'
import { toast } from 'react-toastify'

interface Campaign {
  id: string
  name: string
  subject: string
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'paused'
  total_recipients: number
  sent_count: number
  success_count: number
  failed_count: number
  created_at: string
}

export default function CampaignsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      console.log('📡 Fetching campaigns...')
      const response = await api.get('/emails/campaigns/')
      console.log('✅ Response:', response.data)
      
      let data = []
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          data = response.data
        } else if (response.data.results) {
          data = response.data.results
        } else if (response.data.data) {
          data = response.data.data
        }
      }
      
      console.log('📊 Processed data:', data)
      setCampaigns(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error('❌ Error fetching campaigns:', error)
      
      if (error.response) {
        console.log('Status:', error.response.status)
        console.log('Data:', error.response.data)
        toast.error(`خطا: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('خطا در ارتباط با سرور')
      } else {
        toast.error('خطا: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // ==================== دکمه‌های کمپین ====================

  // ✅ ارسال کمپین (با بررسی گیرنده)
  const sendCampaign = async (id: string) => {
    // چک کردن وجود گیرنده
    try {
      const campaignResponse = await api.get(`/emails/campaigns/${id}/`)
      const campaign = campaignResponse.data
      
      if (!campaign.total_recipients || campaign.total_recipients === 0) {
        toast.error('❌ این کمپین هیچ گیرنده‌ای ندارد! لطفاً ابتدا گیرنده اضافه کنید.')
        return
      }
    } catch (error) {
      console.error('Error checking campaign:', error)
    }

    // اگر کمپین قبلاً کامل شده یا ناموفق بوده، پیام تایید متفاوت
    let confirmMessage = 'آیا از ارسال این کمپین مطمئن هستید؟'
    let statusMessage = 'ارسال کمپین شروع شد!'
    
    // دریافت وضعیت فعلی کمپین
    try {
      const campaignResponse = await api.get(`/emails/campaigns/${id}/`)
      const campaign = campaignResponse.data
      
      if (campaign.status === 'completed') {
        confirmMessage = '⚠️ این کمپین قبلاً ارسال شده است. آیا می‌خواهید دوباره ارسال کنید؟\n(گیرنده‌های جدید اضافه شده‌اند)'
        statusMessage = '✅ کمپین با موفقیت دوباره ارسال شد!'
      } else if (campaign.status === 'failed') {
        confirmMessage = '⚠️ این کمپین قبلاً ناموفق بوده است. آیا می‌خواهید دوباره تلاش کنید؟'
        statusMessage = '✅ ارسال مجدد کمپین شروع شد!'
      }
    } catch (error) {
      console.error('Error checking campaign status:', error)
    }
    
    if (!confirm(confirmMessage)) return
    
    try {
      const response = await api.post(`/emails/campaigns/${id}/send/`)
      toast.success(`✅ ${response.data.message || statusMessage}`)
      fetchCampaigns()
    } catch (error: any) {
      console.error('Error sending campaign:', error)
      
      if (error.response?.data?.error?.includes('sending')) {
        toast.error('⏳ این کمپین در حال ارسال است! لطفاً صبر کنید.')
      } else {
        toast.error(error.response?.data?.error || 'خطا در ارسال کمپین')
      }
    }
  }

  // ⏸️ توقف کمپین
  const pauseCampaign = async (id: string) => {
    try {
      const response = await api.post(`/emails/campaigns/${id}/pause/`)
      toast.success(`⏸️ ${response.data.message || 'کمپین متوقف شد'}`)
      fetchCampaigns()
    } catch (error: any) {
      console.error('Error pausing campaign:', error)
      toast.error(error.response?.data?.error || 'خطا در توقف کمپین')
    }
  }

  // ▶️ ادامه کمپین
  const resumeCampaign = async (id: string) => {
    try {
      const response = await api.post(`/emails/campaigns/${id}/resume/`)
      toast.success(`▶️ ${response.data.message || 'کمپین ادامه یافت'}`)
      fetchCampaigns()
    } catch (error: any) {
      console.error('Error resuming campaign:', error)
      toast.error(error.response?.data?.error || 'خطا در ادامه کمپین')
    }
  }

  // 🗑️ حذف کمپین
  const deleteCampaign = async (id: string) => {
    if (!confirm(t('are_you_sure'))) return
    
    try {
      await api.delete(`/emails/campaigns/${id}/`)
      toast.success(t('delete') || 'کمپین حذف شد')
      fetchCampaigns()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error(t('error_occurred') || 'خطا در حذف کمپین')
    }
  }

  // ==================== توابع وضعیت ====================

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': t('draft') || 'پیش‌نویس',
      'scheduled': t('scheduled') || 'برنامه‌ریزی شده',
      'sending': t('sending') || 'در حال ارسال',
      'completed': t('completed') || 'تکمیل شد',
      'failed': t('failed') || 'ناموفق',
      'paused': t('paused') || 'متوقف شده',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'draft': 'bg-gray-500',
      'scheduled': 'bg-yellow-500',
      'sending': 'bg-blue-500 animate-pulse',
      'completed': 'bg-green-500',
      'failed': 'bg-red-500',
      'paused': 'bg-orange-500',
    }
    return colorMap[status] || 'bg-gray-500'
  }

  const getStatusTextColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'draft': 'text-gray-400',
      'scheduled': 'text-yellow-400',
      'sending': 'text-blue-400',
      'completed': 'text-green-400',
      'failed': 'text-red-400',
      'paused': 'text-orange-400',
    }
    return colorMap[status] || 'text-gray-400'
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('campaigns')}</h1>
            <p className="text-gray-400 text-sm mt-1">{t('campaigns_description') || 'مدیریت کمپین‌های ارسال ایمیل'}</p>
          </div>
          <button
            onClick={() => router.push('/campaigns/new')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors flex items-center gap-2"
          >
            <span>➕</span> {t('create_campaign')}
          </button>
        </div>

        {/* Campaigns List */}
        <div className="glass rounded-2xl p-6">
          {loading ? (
            <p className="text-gray-400 text-center py-12">{t('loading')}</p>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">📭 {t('no_campaigns') || 'هیچ کمپینی وجود ندارد'}</p>
              <p className="text-gray-500 text-sm mt-2">
                {t('create_campaign_description') || 'برای شروع، روی دکمه "ایجاد کمپین جدید" کلیک کنید'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex flex-wrap items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all"
                >
                  {/* اطلاعات کمپین */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(campaign.status)}`}></span>
                      <span className="text-white font-medium">{campaign.name}</span>
                      <span className={`text-xs ${getStatusTextColor(campaign.status)} px-2 py-1 rounded-full bg-gray-700/50`}>
                        {getStatusText(campaign.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      📧 {t('subject')}: {campaign.subject}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      👥 {campaign.total_recipients} {t('recipients')} | 
                      ✅ {campaign.success_count} {t('success')} | 
                      ❌ {campaign.failed_count} {t('failed')}
                    </div>
                  </div>

                  {/* دکمه‌های عملیات */}
                  <div className="flex gap-2 mt-2 sm:mt-0 flex-wrap">
                    {/* مشاهده */}
                    <button
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                      className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors"
                    >
                      👁️ {t('view')}
                    </button>

                    {/* ✅ ارسال - برای همه وضعیت‌ها به جز sending */}
                    {campaign.status !== 'sending' && (
                      <button
                        onClick={() => sendCampaign(campaign.id)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          campaign.status === 'completed' || campaign.status === 'failed'
                            ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                            : campaign.status === 'draft' || campaign.status === 'paused'
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          campaign.status === 'completed' || campaign.status === 'failed'
                            ? 'ارسال مجدد'
                            : campaign.status === 'draft' || campaign.status === 'paused'
                            ? 'ارسال کمپین'
                            : ''
                        }
                      >
                        {campaign.status === 'completed' || campaign.status === 'failed' 
                          ? '🔄 ' + (t('send_again') || 'ارسال مجدد')
                          : '🚀 ' + (t('send') || 'ارسال')}
                      </button>
                    )}

                    {/* توقف - فقط برای در حال ارسال */}
                    {campaign.status === 'sending' && (
                      <button
                        onClick={() => pauseCampaign(campaign.id)}
                        className="px-3 py-1 text-sm bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg transition-colors"
                      >
                        ⏸️ {t('pause') || 'توقف'}
                      </button>
                    )}

                    {/* ادامه - فقط برای متوقف شده */}
                    {campaign.status === 'paused' && (
                      <button
                        onClick={() => resumeCampaign(campaign.id)}
                        className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors"
                      >
                        ▶️ {t('resume') || 'ادامه'}
                      </button>
                    )}

                    {/* ویرایش - فقط برای پیش‌نویس */}
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => router.push(`/campaigns/${campaign.id}/edit`)}
                        className="px-3 py-1 text-sm bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg transition-colors"
                      >
                        ✏️ {t('edit')}
                      </button>
                    )}

                    {/* حذف */}
                    <button
                      onClick={() => deleteCampaign(campaign.id)}
                      className="px-3 py-1 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                    >
                      🗑️ {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}