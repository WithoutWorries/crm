'use client'

import { formatRelativeDate, isOverdue } from '@/lib/utils'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants'
import { Task } from '@prisma/client'
import { Badge } from '@/components/shared/badge'
import Link from 'next/link'

interface UpcomingTasksProps {
  tasks: Task[]
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  return (
    <div className="bg-white dark:bg-fmea-bg2 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-fmea-border">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-fmea-text mb-4">Today & Upcoming Tasks</h3>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-fmea-dim">No tasks due soon</p>
        ) : (
          tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks?id=${task.id}`}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-fmea-border hover:bg-slate-50 dark:hover:bg-fmea-bg3 transition-colors group"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-fmea-text group-hover:text-indigo-600 dark:group-hover:text-fmea-accent transition-colors">
                  {task.title}
                </p>
                {task.dueDate && (
                  <p className="text-xs text-slate-600 dark:text-fmea-dim mt-0.5">
                    Due {formatRelativeDate(task.dueDate)}
                  </p>
                )}
              </div>
              <Badge
                label={PRIORITY_LABELS[task.priority]}
                color={PRIORITY_COLORS[task.priority]}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
