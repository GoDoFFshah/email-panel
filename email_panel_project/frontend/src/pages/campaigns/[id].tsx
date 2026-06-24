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
  body: string
  status: string
  total_recipients: number
  sent_count: number
  success_count: number
  failed_count: number
  created_at: string
}

export default function CampaignDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const { t } = useLanguage()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchCampaign()
    }
  }, [id])

  const fetchCampaign = async () => {
    try {
      const response = await api.get(`/emails/campaigns/${id}/`)
      setCampaign(response.data)
    } catch (error) {
      console.error('Error fetching campaign:', error)
      toast.error(t('error_occurred'))
      router.push('/campaigns')
    } finally {
      setLoading(false)
    }
  }

  // تابع برای ترجمه وضعیت
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': t('draft'),
      'scheduled': t('scheduled'),
      'sending': t('sending'),
      'completed': t('completed'),
      'failed': t('failed'),
      'paused': t('paused'),
    }
    return statusMap[status] || status
  }

  // تابع برای رنگ وضعیت
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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-400">{t('loading')}</p>
        </div>
      </MainLayout>
    )
  }

  if (!campaign) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-400">{t('not_found')}</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
          <button
            onClick={() => router.push('/campaigns')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
          >
            ← {t('back')}
          </button>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          {/* وضعیت */}
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${getStatusColor(campaign.status)}`}></span>
            <span className="text-white font-medium">{getStatusText(campaign.status)}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-sm">{t('subject')}</p>
              <p className="text-white font-medium">{campaign.subject}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">{t('total_recipients') || 'تعداد گیرنده‌ها'}</p>
              <p className="text-white font-medium">{campaign.total_recipients}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">{t('sent_count') || 'ارسال شده'}</p>
              <p className="text-white font-medium">{campaign.sent_count}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">{t('success_count') || 'موفق'}</p>
              <p className="text-green-400 font-medium">{campaign.success_count}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">{t('failed_count') || 'ناموفق'}</p>
              <p className="text-red-400 font-medium">{campaign.failed_count}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">{t('created_at') || 'تاریخ ایجاد'}</p>
              <p className="text-white font-medium">
                {new Date(campaign.created_at).toLocaleDateString('fa-IR')}
              </p>
            </div>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-2">{t('body')}</p>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-white whitespace-pre-wrap">{campaign.body}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-700/50">
            {campaign.status === 'draft' && (
              <button
                onClick={() => router.push(`/campaigns/${campaign.id}/edit`)}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white transition-colors"
              >
                ✏️ {t('edit')}
              </button>
            )}
            <button
              onClick={() => router.push('/campaigns')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
            >
              {t('back_to_list')}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}