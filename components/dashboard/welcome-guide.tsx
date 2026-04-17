'use client'

import Link from 'next/link'
import { Zap, Users, Kanban, CheckSquare, Activity, ArrowRight } from 'lucide-react'

const steps = [
  {
    icon: Zap,
    color: 'from-cyan-500 to-teal-500',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/10',
    border: 'border-cyan-500/30',
    iconColor: 'text-cyan-500',
    title: 'Capture an enquiry',
    description: 'Paste an email or call notes into Quick Capture — Claude extracts contact details and project info automatically.',
    href: '/quick-capture',
    cta: 'Open Quick Capture',
  },
  {
    icon: Users,
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    iconColor: 'text-violet-500',
    title: 'Add your contacts',
    description: 'Build your network. Each contact tracks emails, phone numbers, LinkedIn, and the relationship history.',
    href: '/contacts/new',
    cta: 'Add a contact',
  },
  {
    icon: Kanban,
    color: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    iconColor: 'text-indigo-500',
    title: 'Track your pipeline',
    description: 'Move opportunities through stages — from first enquiry to won contract. See your pipeline value at a glance.',
    href: '/pipeline',
    cta: 'View pipeline',
  },
  {
    icon: CheckSquare,
    color: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    iconColor: 'text-emerald-500',
    title: 'Stay on top of tasks',
    description: 'Set follow-up tasks and deadlines. Overdue tasks appear on this dashboard so nothing slips through.',
    href: '/tasks/new',
    cta: 'Create a task',
  },
  {
    icon: Activity,
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    iconColor: 'text-amber-500',
    title: 'Log every interaction',
    description: 'Record calls, emails, and meetings as activities. Build a full history for every contact and project.',
    href: '/activities/new',
    cta: 'Log an activity',
  },
]

export function WelcomeGuide() {
  return (
    <div className="relative bg-white dark:bg-fmea-bg2 rounded-2xl border border-slate-200 dark:border-fmea-border overflow-hidden">
      {/* Header gradient bar */}
      <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500" />

      <div className="p-6">
        <div className="mb-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-fmea-hi">Quick reference</h2>
          <p className="text-sm text-slate-500 dark:text-fmea-dim mt-0.5">
            Jump to any section of the CRM.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <Link
                key={step.href}
                href={step.href}
                className={`group relative flex flex-col gap-3 p-4 rounded-xl border ${step.bg} ${step.border} hover:scale-[1.02] transition-transform`}
              >
                {/* Step number */}
                <span className="absolute top-3 right-3 text-[10px] font-bold text-slate-400 dark:text-fmea-dim">
                  {i + 1}
                </span>

                <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${step.color} w-fit`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-fmea-hi leading-snug">
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <span className={`mt-auto inline-flex items-center gap-1 text-xs font-medium ${step.iconColor} group-hover:gap-2 transition-all`}>
                  {step.cta}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
