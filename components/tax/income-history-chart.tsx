'use client'

import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Month {
  key: string
  label: string
  isCurrent: boolean
  revenueExVatCents: number
  grossCashReceivedCents: number
  businessCostsCents: number
  recordedResultCents: number
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function total(months: Month[]) {
  return months.reduce((sum, month) => sum + month.revenueExVatCents, 0)
}

export function IncomeHistoryChart({ months, currency }: { months: Month[]; currency: string }) {
  const values = months.flatMap((month) => [
    month.revenueExVatCents,
    month.businessCostsCents,
    Math.abs(month.recordedResultCents),
  ])
  const maximum = Math.max(...values, 1)
  const completeMonths = months.filter((month) => !month.isCurrent)
  const recent = completeMonths.slice(-3)
  const previous = completeMonths.slice(-6, -3)
  const recentAverage = recent.length ? Math.round(total(recent) / recent.length) : 0
  const previousAverage = previous.length ? Math.round(total(previous) / previous.length) : 0
  const trendPercent = previousAverage > 0
    ? Math.round(((recentAverage - previousAverage) / previousAverage) * 100)
    : null
  const hasData = values.some((value) => value !== 0)

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-sm dark:border-fmea-border dark:bg-fmea-nav">
      <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300"><BarChart3 className="h-4 w-4" />Income history</div>
          <h2 className="mt-1 text-lg font-semibold">Two years at a glance</h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">Net revenue, recorded business costs and the resulting balance by payment month.</p>
        </div>
        {trendPercent !== null && (
          <div className={cn(
            'inline-flex items-center gap-2 self-start rounded-2xl border px-3 py-2 text-xs font-semibold',
            trendPercent >= 0
              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
              : 'border-rose-500/40 bg-rose-500/15 text-rose-300'
          )}>
            {trendPercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            Last 3 complete months {trendPercent >= 0 ? '+' : ''}{trendPercent}%
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 px-5 pt-4 text-[11px] font-medium text-slate-300 sm:px-6">
        <Legend colour="bg-cyan-400" label="Revenue ex VAT" />
        <Legend colour="bg-amber-400" label="Business costs ex VAT" />
        <Legend colour="bg-violet-400" label="Recorded result" />
        <span className="ml-auto text-slate-500">Current month is incomplete</span>
      </div>

      {hasData ? (
        <div className="overflow-x-auto px-5 pb-5 pt-3 sm:px-6">
          <div className="grid min-w-[1120px] gap-2" style={{ height: 290, gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
            {months.map((month) => {
              const revenueHeight = Math.max(2, Math.round((month.revenueExVatCents / maximum) * 210))
              const costsHeight = Math.max(2, Math.round((month.businessCostsCents / maximum) * 210))
              const resultHeight = Math.max(2, Math.round((Math.abs(month.recordedResultCents) / maximum) * 210))
              return (
                <div key={month.key} className={cn('flex min-w-0 flex-col rounded-xl px-1 pt-2', month.isCurrent && 'bg-cyan-400/10 ring-1 ring-inset ring-cyan-400/30')}>
                  <div className="flex h-[218px] items-end justify-center gap-0.5 border-b border-slate-700/80">
                    <div className="w-2 rounded-t-sm bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.28)]" style={{ height: revenueHeight }} title={`${month.label}: revenue ${money(month.revenueExVatCents, currency)}`} />
                    <div className="w-2 rounded-t-sm bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)]" style={{ height: costsHeight }} title={`${month.label}: costs ${money(month.businessCostsCents, currency)}`} />
                    <div className={cn('w-2 rounded-t-sm shadow-[0_0_12px_rgba(167,139,250,0.24)]', month.recordedResultCents < 0 ? 'bg-rose-500' : 'bg-violet-400')} style={{ height: resultHeight }} title={`${month.label}: result ${money(month.recordedResultCents, currency)}`} />
                  </div>
                  <p className="mt-2 truncate text-center text-[10px] font-semibold text-slate-400">{month.label}</p>
                  {month.isCurrent && <span className="mt-1 text-center text-[8px] font-bold uppercase tracking-wide text-cyan-300">Partial</span>}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="px-6 py-14 text-center text-sm text-slate-400">Income and cost bars will appear as payment records are added.</div>
      )}
    </section>
  )
}

function Legend({ colour, label }: { colour: string; label: string }) {
  return <span className="inline-flex items-center gap-2"><span className={cn('h-2.5 w-2.5 rounded-sm', colour)} />{label}</span>
}
