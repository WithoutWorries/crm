'use client'

import { useEffect, useState } from 'react'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants'
import { Badge } from '@/components/shared/badge'
import { formatRelativeDate, isOverdue, isDueToday, isDueSoon } from '@/lib/utils'
import { Task } from '@prisma/client'
import { Plus, Check, Trash2 } from 'lucide-react'
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
