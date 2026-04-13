'use client'

import { useEffect, useState } from 'react'
import { ACTIVITY_TYPE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { Activity } from '@prisma/client'
import { Mail, Phone, Users, MessageSquare, FileText, BookOpen, Zap } from 'lucide-react'

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities')
      const data = await res.json()
      setActivities(data)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-fmea-hi">Activities</h1>
        <p className="text-slate-600 dark:text-fmea-dim mt-1">Log of all your interactions</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">No activities yet</p>
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = getActivityIcon(activity.type)
              return (
                <div
                  key={activity.id}
                  className="bg-white dark:bg-fmea-bg2 rounded-lg shadow-sm border border-slate-200 dark:border-fmea-border p-4 flex gap-4"
                >
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-fmea-bg3">
                      <Icon className="h-5 w-5 text-slate-600 dark:text-fmea-dim" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-fmea-text">{activity.subject}</p>
                        <p className="text-xs text-slate-600 dark:text-fmea-dim mt-0.5">
                          {(ACTIVITY_TYPE_LABELS as Record<string, string>)[activity.type] ?? activity.type}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-fmea-dim">
                        {formatDate(activity.happenedAt)}
                      </span>
                    </div>
                    {activity.summary && (
                      <p className="text-sm text-slate-600 dark:text-fmea-dim mt-2">{activity.summary}</p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
