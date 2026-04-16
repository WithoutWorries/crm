'use client'

import { useEffect, useState } from 'react'
import { ACTIVITY_TYPE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { Activity } from '@prisma/client'
import { Mail, Phone, Users, MessageSquare, FileText, BookOpen, Zap, Trash2 } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'

export default function ActivitiesPage() {
  const currentUser = useCurrentUser()
  const isAdmin = currentUser?.role === 'ADMIN'
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleDeleteActivity = async (id: string) => {
    try {
      await fetch(`/api/activities/${id}`, { method: 'DELETE' })
      setActivities((prev) => prev.filter((a) => a.id !== id))
      setConfirmDeleteId(null)
    } catch (error) {
      console.error('Error deleting activity:', error)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities')
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) setActivities(data)
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
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-fmea-text">{activity.subject}</p>
                        <p className="text-xs text-slate-600 dark:text-fmea-dim mt-0.5">
                          {(ACTIVITY_TYPE_LABELS as Record<string, string>)[activity.type] ?? activity.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-slate-500 dark:text-fmea-dim">
                          {formatDate(activity.happenedAt)}
                        </span>
                        {isAdmin && (confirmDeleteId === activity.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteActivity(activity.id)}
                              className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(activity.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete activity"
                          >
                            <Trash2 className="h-4 w-4 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400" />
                          </button>
                        ))}
                      </div>
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
