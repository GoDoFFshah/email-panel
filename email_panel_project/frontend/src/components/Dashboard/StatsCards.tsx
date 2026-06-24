import React from 'react'
import { motion } from 'framer-motion'
import { 
  EnvelopeIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

interface StatsCardsProps {
  stats: any
  isLoading: boolean
}

const StatCard: React.FC<{
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  trend?: number
}> = ({ title, value, icon, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        {trend !== undefined && (
          <p className={`text-sm mt-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
    </div>
  </motion.div>
)

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6 animate-pulse">
            <div className="h-20 bg-gray-700/50 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Sends',
      value: stats?.total_sends || 0,
      icon: <EnvelopeIcon className="w-6 h-6 text-blue-400" />,
      color: 'bg-blue-500/10',
      trend: 12.5,
    },
    {
      title: 'Active Recipients',
      value: stats?.total_emails || 0,
      icon: <UserGroupIcon className="w-6 h-6 text-green-400" />,
      color: 'bg-green-500/10',
      trend: 8.3,
    },
    {
      title: 'Success Rate',
      value: `${stats?.success_rate || 0}%`,
      icon: <ChartBarIcon className="w-6 h-6 text-purple-400" />,
      color: 'bg-purple-500/10',
      trend: 3.2,
    },
    {
      title: 'Quota Remaining',
      value: stats?.remaining_quota || 0,
      icon: <ShieldCheckIcon className="w-6 h-6 text-yellow-400" />,
      color: 'bg-yellow-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  )
}