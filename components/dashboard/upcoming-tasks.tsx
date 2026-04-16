'use client'

import { formatRelativeDate, isOverdue, isDueToday } from '@/lib/utils'
import { PRIORITY_LABELS } from '@/lib/constants'
import { Task } from '@prisma/client'
import Link from 'next/link'
import { CheckSquare, AlertTriangle, Clock } from 'lucide-react'

interface UpcomingTasksProps {
  tasks: Task[]
}

const PRIORITY_DOT: Record<string, string> = {
  LOW:    'bg-slate-300 dark:bg-slate-600',
  MEDIUM: 'bg-blue-400',
  HIGH:   'bg-orange-400',
  URGENT: 'bg-rose-500',
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  return (
    <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-fmea-hi">Upcoming Tasks</h3>
        <Link href="/tasks" className="text-xs text-indigo-500 dark:text-fmea-accent hover:underline">
          View all
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CheckSquare className="h-8 w-8 text-emerald-400 mb-2" />
          <p className="text-sm text-slate-500 dark:text-fmea-dim">All clear — no tasks due soon</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tasks.map((task) => {
            const overdue = task.dueDate ? isOverdue(task.dueDate) : false
            const today = task.dueDate ? isDueToday(task.dueDate) : false

            let borderColor = 'border-slate-200 dark:border-fmea-border'
            let bgColor = 'bg-white dark:bg-fmea-bg2'
            let Icon = Clock

            if (overdue) {
              borderColor = 'border-rose-300 dark:border-rose-700'
              bgColor = 'bg-rose-50 dark:bg-rose-900/20'
              Icon = AlertTriangle
            } else if (today) {
              borderColor = 'border-amber-300 dark:border-amber-700'
              bgColor = 'bg-amber-50 dark:bg-amber-900/20'
              Icon = Clock
            }

            return (
              <div
                key={task.id}
                className={`${bgColor} ${borderColor} border rounded-lg p-4`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <Icon
                    className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                      overdue ? 'text-rose-500' : today ? 'text-amber-500' : 'text-slate-400 dark:text-fmea-dim'
                    }`}
                  />
                  <p className="text-sm font-medium text-slate-900 dark:text-fmea-text leading-snug">{task.title}</p>
                </div>
                <div className="flex items-center justify-between pl-6">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                    <span className="text-xs text-slate-500 dark:text-fmea-dim">{PRIORITY_LABELS[task.priority]}</span>
                  </div>
                  {task.dueDate && (
                    <span className={`text-xs font-medium ${overdue ? 'text-rose-600 dark:text-rose-400' : today ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-fmea-dim'}`}>
                      {formatRelativeDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
