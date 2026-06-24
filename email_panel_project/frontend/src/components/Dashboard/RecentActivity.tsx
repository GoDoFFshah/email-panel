import React from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { fa } from 'date-fns/locale'

interface RecentActivityProps {
  activities: any[]
  isLoading: boolean
}

const getActivityIcon = (action: string) => {
  if (action.includes('send') || action.includes('campaign')) return '📧'
  if (action.includes('login')) return '🔑'
  if (action.includes('create') || action.includes('add')) return '➕'
  if (action.includes('delete') || action.includes('remove')) return '🗑️'
  if (action.includes('update') || action.includes('edit')) return '✏️'
  return '📌'
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 animate-pulse">
        <div className="h-8 w-32 bg-gray-700/50 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-700/50 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
      
      {activities && activities.length > 0 ? (
        <div className="space-y-3">
          {activities.slice(0, 10).map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-700/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getActivityIcon(activity.action)}</span>
                <div>
                  <p className="text-white text-sm">{activity.action}</p>
                  {activity.details && (
                    <p className="text-gray-400 text-xs">
                      {Object.entries(activity.details || {})
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(' | ')}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-gray-400 text-xs whitespace-nowrap">
                {formatDistanceToNow(new Date(activity.timestamp), { 
                  addSuffix: true,
                  locale: fa 
                })}
              </span>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">No recent activity</p>
        </div>
      )}
    </div>
  )
}