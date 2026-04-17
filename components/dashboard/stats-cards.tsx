'use client'

import { Target, TrendingUp, AlertCircle, Clock, Users, Trophy } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface StatsCardsProps {
  openOpportunities: number
  pipelineValue: number
  overdueTasks: number
  followUpsNeeded: number
  totalContacts: number
  wonOpportunities: number
}

export function StatsCards({
  openOpportunities,
  pipelineValue,
  overdueTasks,
  followUpsNeeded,
  totalContacts,
  wonOpportunities,
}: StatsCardsProps) {
  const cards = [
    {
      icon: Target,
      label: 'Open Opportunities',
      value: openOpportunities.toString(),
      bg: 'bg-indigo-600',
      iconBg: 'bg-indigo-500',
      urgent: false,
    },
    {
      icon: TrendingUp,
      label: 'Pipeline Value',
      value: formatCurrency(pipelineValue, 'EUR'),
      bg: 'bg-emerald-600',
      iconBg: 'bg-emerald-500',
      urgent: false,
    },
    {
      icon: Trophy,
      label: 'Won This Year',
      value: wonOpportunities.toString(),
      bg: 'bg-teal-600',
      iconBg: 'bg-teal-500',
      urgent: false,
    },
    {
      icon: AlertCircle,
      label: 'Overdue Tasks',
      value: overdueTasks.toString(),
      bg: overdueTasks > 0 ? 'bg-rose-600' : 'bg-slate-500',
      iconBg: overdueTasks > 0 ? 'bg-rose-500' : 'bg-slate-400',
      urgent: overdueTasks > 0,
    },
    {
      icon: Clock,
      label: 'Follow-ups Due',
      value: followUpsNeeded.toString(),
      bg: followUpsNeeded > 0 ? 'bg-amber-500' : 'bg-slate-500',
      iconBg: followUpsNeeded > 0 ? 'bg-amber-400' : 'bg-slate-400',
      urgent: followUpsNeeded > 0,
    },
    {
      icon: Users,
      label: 'Total Contacts',
      value: totalContacts.toString(),
      bg: 'bg-violet-600',
      iconBg: 'bg-violet-500',
      urgent: false,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className={`${card.bg} rounded-xl p-5 text-white relative overflow-hidden`}
          >
            {/* Background decoration */}
            <div className="absolute -right-3 -top-3 opacity-20">
              <Icon className="h-16 w-16" />
            </div>

            <div className={`inline-flex p-2 rounded-lg ${card.iconBg} mb-3`}>
              <Icon className="h-4 w-4 text-white" />
            </div>

            <p className="text-2xl font-bold text-white leading-none mb-1">
              {card.value}
            </p>
            <p className="text-xs text-white/80 font-medium leading-tight">
              {card.label}
            </p>

            {card.urgent && (
              <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-white animate-pulse" />
            )}
          </div>
        )
      })}
    </div>
  )
}
