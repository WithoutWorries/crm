'use client'

import { useEffect, useState } from 'react'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants'
import { Badge } from '@/components/shared/badge'
import { formatRelativeDate, isOverdue, isDueToday, isDueSoon } from '@/lib/utils'
import { Task } from '@prisma/client'
import { Plus, Check, Trash2, Pencil, CalendarDays, Copy, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useCurrentUser } from '@/hooks/use-current-user'

export default function TasksPage() {
  const currentUser = useCurrentUser()
  const isAdmin = currentUser?.role === 'ADMIN'
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) setTasks(data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [calendarToken, setCalendarToken] = useState<string | null>(null)
  const [copiedCal, setCopiedCal] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    fetch('/api/calendar/token')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.token) setCalendarToken(d.token) })
      .catch(() => {})
  }, [])

  const calendarUrl = calendarToken
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://crm.frasermackie.com'}/api/calendar/tasks.ics?token=${calendarToken}`
    : null

  const handleCopyCal = async () => {
    if (!calendarUrl) return
    await navigator.clipboard.writeText(calendarUrl)
    setCopiedCal(true)
    setTimeout(() => setCopiedCal(false), 2000)
  }

  const handleRegenerateToken = async () => {
    if (!confirm('Regenerating the token will break any existing calendar subscriptions. Continue?')) return
    setRegenerating(true)
    const res = await fetch('/api/calendar/token', { method: 'POST' })
    if (res.ok) {
      const d = await res.json()
      setCalendarToken(d.token)
    }
    setRegenerating(false)
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      setConfirmDeleteId(null)
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const groupedTasks = {
    overdue: tasks.filter(
      (t) => !['COMPLETED', 'CANCELLED'].includes(t.status) && t.dueDate && isOverdue(t.dueDate)
    ),
    dueToday: tasks.filter(
      (t) => !['COMPLETED', 'CANCELLED'].includes(t.status) && t.dueDate && isDueToday(t.dueDate)
    ),
    dueThisWeek: tasks.filter(
      (t) =>
        !['COMPLETED', 'CANCELLED'].includes(t.status) &&
        t.dueDate &&
        isDueSoon(t.dueDate) &&
        !isDueToday(t.dueDate)
    ),
    later: tasks.filter(
      (t) =>
        !['COMPLETED', 'CANCELLED'].includes(t.status) &&
        (!t.dueDate || (t.dueDate && !isDueSoon(t.dueDate) && !isDueToday(t.dueDate)))
    ),
    completed: tasks.filter((t) => t.status === 'COMPLETED'),
  }

  const TaskItem = ({ task }: { task: Task }) => (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border ${
        task.status === 'COMPLETED'
          ? 'bg-slate-50 dark:bg-fmea-bg3 border-slate-200 dark:border-fmea-border opacity-60'
          : 'bg-white dark:bg-fmea-bg2 border-slate-200 dark:border-fmea-border hover:shadow-sm transition-shadow'
      }`}
    >
      <div className="flex-1">
        <p
          className={`font-medium ${
            task.status === 'COMPLETED'
              ? 'text-slate-600 dark:text-fmea-dim line-through'
              : 'text-slate-900 dark:text-fmea-text'
          }`}
        >
          {task.title}
        </p>
        {task.dueDate && (
          <p className="text-xs text-slate-600 dark:text-fmea-dim mt-1">
            {formatRelativeDate(task.dueDate)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge
          label={PRIORITY_LABELS[task.priority]}
          color={PRIORITY_COLORS[task.priority]}
        />
        {task.status !== 'COMPLETED' && (
          <button
            onClick={() => handleCompleteTask(task.id)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-fmea-bg3 rounded-lg transition-colors"
            title="Mark complete"
          >
            <Check className="h-5 w-5 text-slate-400 dark:text-fmea-dim hover:text-slate-600 dark:hover:text-fmea-text" />
          </button>
        )}
        <Link
          href={['COMPLETED', 'CANCELLED'].includes(task.status) ? `/tasks/${task.id}` : `/tasks/${task.id}/edit`}
          className="p-2 hover:bg-slate-100 dark:hover:bg-fmea-bg3 rounded-lg transition-colors"
          title={['COMPLETED', 'CANCELLED'].includes(task.status) ? 'View task' : 'Edit task'}
        >
          <Pencil className="h-4 w-4 text-slate-400 dark:text-fmea-dim hover:text-slate-600 dark:hover:text-fmea-text" />
        </Link>
        {isAdmin && (confirmDeleteId === task.id ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleDeleteTask(task.id)}
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
            onClick={() => setConfirmDeleteId(task.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete task"
          >
            <Trash2 className="h-4 w-4 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400" />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-fmea-hi">Tasks</h1>
          <p className="text-slate-600 dark:text-fmea-dim mt-1">Manage your action items</p>
        </div>
        <Link
          href="/tasks/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Task
        </Link>
      </div>

      {/* Calendar subscription panel */}
      {calendarUrl && (
        <div className="mb-8 bg-white dark:bg-fmea-bg2 border border-slate-200 dark:border-fmea-border rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shrink-0">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-fmea-hi mb-0.5">Calendar subscription</p>
              <p className="text-xs text-slate-500 dark:text-fmea-dim mb-3">
                Subscribe in Apple Calendar, Outlook, or Google Calendar. Tasks appear as all-day events — shareable with others.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate text-xs bg-slate-50 dark:bg-fmea-bg3 border border-slate-200 dark:border-fmea-border rounded-lg px-3 py-2 text-slate-700 dark:text-fmea-dim font-mono">
                  {calendarUrl}
                </code>
                <button
                  onClick={handleCopyCal}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                >
                  {copiedCal ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedCal ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleRegenerateToken}
                  disabled={regenerating}
                  className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-fmea-text hover:bg-slate-100 dark:hover:bg-fmea-bg3 transition-colors"
                  title="Regenerate token (breaks existing subscriptions)"
                >
                  <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="space-y-8">
          {/* Overdue */}
          {groupedTasks.overdue.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-red-600 mb-3">
                Overdue ({groupedTasks.overdue.length})
              </h2>
              <div className="space-y-2">
                {groupedTasks.overdue.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </section>
          )}

          {/* Due Today */}
          {groupedTasks.dueToday.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-orange-600 mb-3">
                Due Today ({groupedTasks.dueToday.length})
              </h2>
              <div className="space-y-2">
                {groupedTasks.dueToday.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </section>
          )}

          {/* Due This Week */}
          {groupedTasks.dueThisWeek.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                This Week ({groupedTasks.dueThisWeek.length})
              </h2>
              <div className="space-y-2">
                {groupedTasks.dueThisWeek.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </section>
          )}

          {/* Later */}
          {groupedTasks.later.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Later ({groupedTasks.later.length})
              </h2>
              <div className="space-y-2">
                {groupedTasks.later.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {groupedTasks.completed.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-600 mb-3">
                Completed ({groupedTasks.completed.length})
              </h2>
              <div className="space-y-2">
                {groupedTasks.completed.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </section>
          )}

          {Object.values(groupedTasks).every((arr) => arr.length === 0) && (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">No tasks yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
