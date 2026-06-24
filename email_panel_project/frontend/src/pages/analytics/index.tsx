import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { useLanguage } from '@/contexts/LanguageContext'
import { api } from '@/utils/api'
import { toast } from 'react-toastify'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

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

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#22c55e', '#f59e0b']

export default function AnalyticsPage() {
  const { t } = useLanguage()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats/')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error(t('error_occurred'))
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

  if (!stats) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-400">{t('not_found')}</p>
        </div>
      </MainLayout>
    )
  }

  const pieData = [
    { name: t('success'), value: stats.total_sends },
    { name: t('failed'), value: stats.total_failed },
  ]

  const quotaData = [
    { name: t('used_quota'), value: stats.used_quota },
    { name: t('quota_remaining'), value: stats.remaining_quota },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('analytics')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('analytics_description')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-4">
            <p className="text-gray-400 text-sm">{t('total_campaigns')}</p>
            <p className="text-2xl font-bold text-white">{stats.total_campaigns}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-gray-400 text-sm">{t('total_sends')}</p>
            <p className="text-2xl font-bold text-white">{stats.total_sends}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-gray-400 text-sm">{t('success_rate')}</p>
            <p className="text-2xl font-bold text-green-400">{stats.success_rate}%</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-gray-400 text-sm">{t('today_sends')}</p>
            <p className="text-2xl font-bold text-blue-400">{stats.sends_today}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">{t('weekly_chart')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.chart_data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" />
                <YAxis stroke="rgba(255,255,255,0.3)" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30,30,40,0.95)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name={t('total_sends')}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart - Send Status */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">{t('send_status')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30,30,40,0.95)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quota Chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">{t('quota_remaining')}</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.total_quota > 0 ? ((stats.used_quota / stats.total_quota) * 100) : 0}%`
                  }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">{stats.remaining_quota}</p>
              <p className="text-gray-400 text-sm">{t('quota_remaining')}</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}