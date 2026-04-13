'use client'

import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Icon className="h-12 w-12 text-slate-300 dark:text-fmea-dim mb-4" />
      <h3 className="text-lg font-medium text-slate-900 dark:text-fmea-text mb-1">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-fmea-dim mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
