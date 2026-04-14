'use client'

import { formatRelativeDate } from '@/lib/utils'
import { ACTIVITY_TYPE_LABELS } from '@/lib/constants'
import { Activity as ActivityType } from '@prisma/client'
import {
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Users,
  Zap,
  BookOpen,
} from 'lucide-react'

interface ActivityWithRelations extends ActivityType {
  contact?: { fullName: string } | null
  opportunity?: { title: string } | null
}

interface RecentActivityProps {
  activities: ActivityWithRelations[]
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'EMAIL':
      return Mail
    case 'CALL':
      return Phone
    case 'MEETING':
      return Users
    case 'LINKEDIN_MESSAGE':
      return MessageSquare
    case 'PROPOSAL_SENT':
      return FileText
    case 'PROPOSAL_REVIEW':
      return FileText
    case 'NOTE':
      return BookOpen
    default:
      return Zap
  }
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white dark:bg-fmea-bg2 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-fmea-border">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-fmea-text mb-4">Recent Activity</h3>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-fmea-dim">No activities yet</p>
        ) : (
          activities.map((activity) => {
            const Icon = getActivityIcon(activity.type)
            return (
              <div key={activity.id} className="flex gap-3 pb-4 border-b border-slate-100 dark:border-fmea-border last:border-0">
                <div className="flex-shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-fmea-bg3">
                    <Icon className="h-5 w-5 text-slate-600 dark:text-fmea-dim" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-fmea-text">{activity.subject}</p>
                  <p className="text-xs text-slate-600 dark:text-fmea-dim mt-0.5">
                    {ACTIVITY_TYPE_LABELS[activity.type as any]} •{' '}
                    {activity.contact?.fullName && `with ${activity.contact.fullName}`}
                    {activity.opportunity?.title && ` • ${activity.opportunity.title}`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mt-1">
                    {formatRelativeDate(activity.happenedAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
