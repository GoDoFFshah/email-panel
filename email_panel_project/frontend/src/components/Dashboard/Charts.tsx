import React from 'react'
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

interface ChartsProps {
  data: any
  isLoading: boolean
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#22c55e']

export const Charts: React.FC<ChartsProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6 animate-pulse">
            <div className="h-64 bg-gray-700/50 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  const pieData = [
    { name: 'Success', value: data?.total_sends || 0 },
    { name: 'Failed', value: data?.total_failed || 0 },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Line Chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Email Activity (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data?.chart_data || []}>
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
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              name="Emails Sent"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Send Status</h3>
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
  )
}