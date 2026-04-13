'use client'

import { Target, TrendingUp, AlertCircle, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface StatsCardsProps {
  openOpportunities: number
  weightedPipeline: number
  overdueTasks: number
  followUpsNeeded: number
}

export function StatsCards({
  openOpportunities,
  weightedPipeline,
  overdueTasks,
  followUpsNeeded,
}: StatsCardsProps) {
  const stats = [
    {
      icon: Target,
      label: 'Open Opportunities',
      value: openOpportunities.toString(),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: TrendingUp,
      label: 'Pipeline Value',
      value: formatCurrency(weightedPipeline, 'GBP'),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: AlertCircle,
      label: 'Overdue Tasks',
      value: overdueTasks.toString(),
      color: overdueTasks > 0 ? 'text-red-600' : 'text-slate-600',
      bgColor: overdueTasks > 0 ? 'bg-red-50' : 'bg-slate-50',
    },
    {
      icon: Clock,
      label: 'Follow-ups Due',
      value: followUpsNeeded.toString(),
      color: followUpsNeeded > 0 ? 'text-orange-600' : 'text-slate-600',
      bgColor: followUpsNeeded > 0 ? 'bg-orange-50' : 'bg-slate-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="bg-white dark:bg-fmea-bg2 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-fmea-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-fmea-dim mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-fmea-text">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
