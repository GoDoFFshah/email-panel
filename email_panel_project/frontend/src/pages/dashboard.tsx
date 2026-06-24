import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { api } from '@/utils/api'
import { toast } from 'react-toastify'

interface DashboardStats {
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
  recent_activity: Array<{ action: string; timestamp: string; details: any }>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      console.log('📡 Fetching dashboard stats...')
      const response = await api.get('/dashboard/stats/')
      console.log('✅ Dashboard data:', response.data)
      setStats(response.data)
    } catch (error: any) {
      console.error('❌ Error fetching stats:', error)
      if (error.response?.status === 401) {
        toast.error(t('unauthorized'))
      } else {
        toast.error(t('error_occurred'))
      }
    } finally {
      setLoading(false)
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
        <div>
          <h1 className="text-3xl font-bold text-white">
            {t('welcome')}، {user?.first_name || user?.username}!
          </h1>
          <p className="text-gray-400 mt-1">{t('dashboard')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass rounded-2xl p-6">
            <p className="text-gray-400 text-sm">{t('total_sends')}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats?.total_sends || 0}</h3>
          </div>
          <div className="glass rounded-2xl p-6">
            <p className="text-gray-400 text-sm">{t('active_recipients')}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats?.total_emails || 0}</h3>
          </div>
          <div className="glass rounded-2xl p-6">
            <p className="text-gray-400 text-sm">{t('success_rate')}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats?.success_rate || 0}%</h3>
          </div>
          <div className="glass rounded-2xl p-6">
            <p className="text-gray-400 text-sm">{t('quota_remaining')}</p>
            <h3 className="text-2xl font-bold text-blue-400 mt-1">
              {stats?.remaining_quota || 0}
            </h3>
          </div>
        </div>

        {/* جزئیات سهمیه */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">📊 {t('quota_details')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400 text-sm">{t('total_quota')}</p>
              <p className="text-white text-lg font-bold">{stats?.total_quota || 0}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">{t('used_quota')}</p>
              <p className="text-yellow-400 text-lg font-bold">{stats?.used_quota || 0}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">{t('remaining_quota')}</p>
              <p className="text-green-400 text-lg font-bold">{stats?.remaining_quota || 0}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">{t('total_campaigns')}</p>
              <p className="text-white text-lg font-bold">{stats?.total_campaigns || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}