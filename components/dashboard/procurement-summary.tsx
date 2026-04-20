'use client'

import Link from 'next/link'
import { Briefcase, Clock, AlertTriangle, ChevronRight } from 'lucide-react'
import {
  PROCUREMENT_CATEGORY_LABELS,
  PROCUREMENT_CATEGORY_COLORS,
  PROCUREMENT_CATEGORY_BORDER,
} from '@/lib/constants'

interface QuoteSummary {
  status: string
  feeAmount: number | null
  feeCurrency: string
}

interface ProcurementProject {
  id: string
  title: string
  category: string
  decisionDeadline: string | null
  quotes: QuoteSummary[]
}

interface Props {
  projects: ProcurementProject[]
}

function deadlineDays(iso: string | null): number | null {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

function costRange(quotes: QuoteSummary[]): string | null {
  const amounts = quotes
    .filter(q => q.feeAmount !== null && q.status !== 'REJECTED')
    .map(q => q.feeAmount as number)
  if (amounts.length === 0) return null
  const currency = quotes.find(q => q.feeAmount !== null)?.feeCurrency ?? 'EUR'
  const fmt = (n: number) =>
    n.toLocaleString('en-DE', { style: 'currency', currency, maximumFractionDigits: 0 })
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`
}

export function ProcurementSummary({ projects }: Props) {
  if (projects.length === 0) {
    return (
      <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500 text-white">
              <Briefcase className="h-4 w-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-fmea-hi">Procurement</h3>
          </div>
          <Link href="/procurement" className="text-xs text-amber-500 hover:text-amber-600 hover:underline transition-colors">
            View all
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Briefcase className="h-8 w-8 text-amber-300 dark:text-amber-700 mb-2" />
          <p className="text-sm text-slate-500 dark:text-fmea-dim">No active procurement projects</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-md shadow-amber-500/30">
            <Briefcase className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-fmea-hi">Procurement</h3>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
            {projects.length} open
          </span>
        </div>
        <Link href="/procurement" className="text-xs text-amber-500 hover:text-amber-600 transition-colors hover:underline">
          View all
        </Link>
      </div>

      {/* Project list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {projects.map(project => {
          const days = deadlineDays(project.decisionDeadline)
          const overdue = days !== null && days < 0
          const urgent  = days !== null && days >= 0 && days <= 7
          const range   = costRange(project.quotes)
          const received = project.quotes.filter(q => q.status !== 'AWAITED').length
          const total    = project.quotes.length
          const border   = PROCUREMENT_CATEGORY_BORDER[project.category] ?? 'border-slate-400'

          return (
            <Link key={project.id} href={`/procurement/${project.id}`}>
              <div className={`border-l-4 ${border} border border-slate-200 dark:border-fmea-border rounded-lg p-4 hover:shadow-md hover:shadow-amber-500/10 transition-all group`}>

                {/* Category + deadline */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${PROCUREMENT_CATEGORY_COLORS[project.category]}`}>
                    {PROCUREMENT_CATEGORY_LABELS[project.category]}
                  </span>
                  {days !== null && (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      overdue ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' :
                      urgent  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                               'bg-slate-100 text-slate-600 dark:bg-fmea-bg3 dark:text-fmea-dim'
                    }`}>
                      {overdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {overdue ? 'Overdue' : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                    </span>
                  )}
                </div>

                {/* Title */}
                <p className="text-sm font-bold text-slate-900 dark:text-fmea-hi group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug mb-3 line-clamp-2">
                  {project.title}
                </p>

                {/* Bottom: cost + quote progress */}
                <div className="flex items-center justify-between gap-2">
                  {range ? (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {range}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-fmea-dim">No quotes yet</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.max(total, 3) }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 w-3 rounded-sm transition-colors ${
                            i < received ? 'bg-amber-500' : 'bg-slate-200 dark:bg-fmea-bg3'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 dark:text-fmea-dim whitespace-nowrap">
                      {received}/{total}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-fmea-dim group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
