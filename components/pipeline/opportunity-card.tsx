'use client'

import { STAGE_LABELS, PROBABILITY_COLORS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface OpportunityCardProps {
  id: string
  title: string
  companyName?: string | null
  value?: number | null
  probability?: number | null
  stage: string
}

export function OpportunityCard({
  id,
  title,
  companyName,
  value,
  probability,
  stage,
}: OpportunityCardProps) {
  const weightedValue =
    value && probability ? Math.round((value * probability) / 100) : 0

  return (
    <Link href={`/opportunities/${id}`}>
      <div className="bg-white dark:bg-fmea-bg3 rounded-lg shadow-sm border border-slate-200 dark:border-fmea-border p-4 hover:shadow-md transition-shadow cursor-pointer">
        <h4 className="font-medium text-slate-900 dark:text-fmea-text text-sm mb-2 line-clamp-2">{title}</h4>

        {companyName && (
          <p className="text-xs text-slate-600 dark:text-fmea-dim mb-3">{companyName}</p>
        )}

        <div className="space-y-2">
          {value && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600 dark:text-fmea-dim">Value:</span>
              <span className="text-sm font-medium text-slate-900 dark:text-fmea-text">
                {formatCurrency(value, 'GBP')}
              </span>
            </div>
          )}

          {probability && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600 dark:text-fmea-dim">Probability:</span>
              <span className="text-sm font-medium text-slate-900 dark:text-fmea-text">{probability}%</span>
            </div>
          )}

          {value && probability && (
            <div className="flex justify-between items-center border-t border-slate-100 dark:border-fmea-border pt-2 mt-2">
              <span className="text-xs text-slate-600 dark:text-fmea-dim">Weighted:</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-fmea-accent">
                {formatCurrency(weightedValue, 'GBP')}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// Placeholder for future colors
const PROBABILITY_COLORS_PLACEHOLDER: Record<number, string> = {
  10: 'text-red-600',
  25: 'text-orange-600',
  50: 'text-yellow-600',
  75: 'text-green-600',
  100: 'text-green-700',
}
