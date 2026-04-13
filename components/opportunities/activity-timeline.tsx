'use client'

import { formatDate } from '@/lib/utils'
import { ACTIVITY_TYPE_LABELS } from '@/lib/constants'
import { Activity } from '@prisma/client'
import { Mail, Phone, Users, MessageSquare, FileText, BookOpen, Zap } from 'lucide-react'

interface ActivityTimelineProps {
  activities: Activity[]
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
    case 'PROPOSAL_REVIEW':
      return FileText
    case 'NOTE':
      return BookOpen
    default:
      return Zap
  }
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return <p className="text-sm text-slate-600 dark:text-fmea-dim">No activities recorded</p>
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, idx) => {
        const Icon = getActivityIcon(activity.type)
        return (
          <div key={activity.id} className="flex gap-4">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-fmea-bg3">
                <Icon className="h-5 w-5 text-indigo-600 dark:text-fmea-accent" />
              </div>
              {idx !== activities.length - 1 && (
                <div className="h-12 w-0.5 bg-slate-200 dark:bg-fmea-border mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4">
              <div className="flex items-baseline gap-2">
                <p className="font-medium text-slate-900 dark:text-fmea-text">{activity.subject}</p>
                <p className="text-xs text-slate-600 dark:text-fmea-dim">
                  {ACTIVITY_TYPE_LABELS[activity.type as any]}
                </p>
              </div>
              {activity.summary && (
                <p className="text-sm text-slate-600 dark:text-fmea-dim mt-1">{activity.summary}</p>
              )}
              {activity.details && (
                <p className="text-sm text-slate-600 dark:text-fmea-dim mt-1 whitespace-pre-wrap">
                  {activity.details}
                </p>
              )}
              {activity.nextStep && (
                <p className="text-sm text-orange-600 dark:text-fmea-accent2 mt-1 font-medium">
                  Next: {activity.nextStep}
                </p>
              )}
              <p className="text-xs text-slate-500 dark:text-fmea-dim mt-2">
                {formatDate(activity.happenedAt)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
