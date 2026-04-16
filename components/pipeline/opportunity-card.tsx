'use client'

import Link from 'next/link'
import { Building2 } from 'lucide-react'

interface OpportunityCardProps {
  id: string
  title: string
  companyName?: string | null
  value?: number | null
  probability?: number | null
  stage: string
}

export function OpportunityCard({ id, title, companyName, value, probability }: OpportunityCardProps) {
  const weightedValue = value && probability ? Math.round((value * probability) / 100) : null

  return (
    <Link href={`/opportunities/${id}`}>
      <div className="bg-white dark:bg-fmea-bg3 rounded-lg border border-slate-200 dark:border-fmea-border p-2.5 hover:border-indigo-300 dark:hover:border-fmea-accent hover:shadow-sm transition-all cursor-pointer">
        <p className="text-xs font-semibold text-slate-900 dark:text-fmea-text leading-snug line-clamp-2 mb-1">
          {title}
        </p>

        {companyName && (
          <div className="flex items-center gap-1 mb-2">
            <Building2 className="h-3 w-3 text-slate-400 dark:text-fmea-dim flex-shrink-0" />
            <span className="text-xs text-slate-500 dark:text-fmea-dim truncate">{companyName}</span>
          </div>
        )}

        {(weightedValue || probability) && (
          <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 dark:border-fmea-border">
            {weightedValue ? (
              <span className="text-xs font-bold text-indigo-600 dark:text-fmea-accent">
                £{weightedValue.toLocaleString()}
              </span>
            ) : (
              <span />
            )}
            {probability && (
              <span className="text-xs text-slate-400 dark:text-fmea-dim flex-shrink-0">
                {probability}%
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
