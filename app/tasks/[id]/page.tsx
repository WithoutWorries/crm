'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants'
import { Badge } from '@/components/shared/badge'
import { formatRelativeDate } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description?: string | null
  dueDate?: string | null
  priority: string
  status: string
  completedAt?: string | null
  contact?: { id: string; fullName: string } | null
  opportunity?: { id: string; title: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tasks/${params.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setTask(data); else router.push('/tasks') })
      .catch(() => router.push('/tasks'))
      .finally(() => setLoading(false))
  }, [params.id, router])

  if (loading) return <div className="text-center py-12">Loading…</div>
  if (!task) return null

  const isCompleted = task.status === 'COMPLETED'
  const isCancelled = task.status === 'CANCELLED'

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-indigo-600 dark:text-fmea-accent hover:opacity-80 mb-6 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="max-w-2xl">
        {/* Status banner */}
        {(isCompleted || isCancelled) && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm font-medium ${
            isCompleted
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-slate-100 dark:bg-fmea-bg3 text-slate-500 dark:text-fmea-dim border border-slate-200 dark:border-fmea-border'
          }`}>
            {isCompleted
              ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              : <XCircle className="h-4 w-4 flex-shrink-0" />}
            <span>
              {isCompleted ? 'Completed' : 'Cancelled'}
              {task.completedAt && isCompleted && ` · ${formatRelativeDate(task.completedAt)}`}
            </span>
            <span className="ml-auto text-xs opacity-70">Read-only</span>
          </div>
        )}

        <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-6 space-y-5">
          <div>
            <h1 className={`text-xl font-bold mb-1 ${
              isCompleted
                ? 'line-through text-slate-400 dark:text-fmea-dim'
                : 'text-slate-900 dark:text-fmea-hi'
            }`}>
              {task.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge label={PRIORITY_LABELS[task.priority]} color={PRIORITY_COLORS[task.priority]} />
              <span className="text-xs text-slate-500 dark:text-fmea-dim">{STATUS_LABEL[task.status] ?? task.status}</span>
              {task.dueDate && (
                <span className="text-xs text-slate-500 dark:text-fmea-dim">Due {formatRelativeDate(task.dueDate)}</span>
              )}
            </div>
          </div>

          {task.description && (
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-fmea-dim mb-1">Description</p>
              <p className="text-sm text-slate-700 dark:text-fmea-text whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {(task.contact || task.opportunity) && (
            <div className="pt-2 border-t border-slate-100 dark:border-fmea-border space-y-2">
              {task.contact && (
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-fmea-dim mb-0.5">Contact</p>
                  <Link href={`/contacts/${task.contact.id}`} className="text-sm text-indigo-600 dark:text-fmea-accent hover:underline">
                    {task.contact.fullName}
                  </Link>
                </div>
              )}
              {task.opportunity && (
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-fmea-dim mb-0.5">Opportunity</p>
                  <Link href={`/opportunities/${task.opportunity.id}`} className="text-sm text-indigo-600 dark:text-fmea-accent hover:underline">
                    {task.opportunity.title}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
