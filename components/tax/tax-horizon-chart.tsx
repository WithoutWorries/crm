'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

type LiabilityType = 'VAT' | 'INCOME_TAX_PREPAYMENT' | 'PRIOR_YEAR_SETTLEMENT' | 'OTHER'
type DisplayStatus = 'PAID' | 'OVERDUE' | 'URGENT' | 'DUE_SOON' | 'ESTIMATED' | 'NOTICE_RECEIVED'

interface TimelineItem {
  id: string
  label: string
  type: LiabilityType
  amountCents: number
  dueDate: string
  status: 'ESTIMATED' | 'NOTICE_RECEIVED' | 'PAID'
  displayStatus: DisplayStatus
}

interface TimelineMonth {
  key: string
  label: string
  isPast: boolean
  isCurrent: boolean
  knownCents: number
  projectedCents: number
  items: TimelineItem[]
  projectionLabel: string | null
}

interface MonthAmounts {
  vat: number
  projectedVat: number
  prepayment: number
  priorYear: number
  other: number
  total: number
}

const STATUS_LABELS: Record<DisplayStatus, string> = {
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  URGENT: 'Due within 7 days',
  DUE_SOON: 'Due within 30 days',
  ESTIMATED: 'Estimated',
  NOTICE_RECEIVED: 'Notice received',
}

const STATUS_STYLES: Record<DisplayStatus, string> = {
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300',
  OVERDUE: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300',
  URGENT: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300',
  DUE_SOON: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300',
  ESTIMATED: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-fmea-border dark:bg-fmea-bg3 dark:text-fmea-dim',
  NOTICE_RECEIVED: 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/70 dark:bg-cyan-950/30 dark:text-cyan-300',
}

function money(cents: number, currency: string, compact = false) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(cents / 100)
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00.000Z`))
}

function amountForType(items: TimelineItem[], type: LiabilityType) {
  return items
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + Math.max(item.amountCents, 0), 0)
}

function amountsForMonth(month: TimelineMonth): MonthAmounts {
  const vat = amountForType(month.items, 'VAT')
  const prepayment = amountForType(month.items, 'INCOME_TAX_PREPAYMENT')
  const priorYear = amountForType(month.items, 'PRIOR_YEAR_SETTLEMENT')
  const other = amountForType(month.items, 'OTHER')
  return {
    vat,
    projectedVat: month.projectedCents,
    prepayment,
    priorYear,
    other,
    total: vat + month.projectedCents + prepayment + priorYear + other,
  }
}

function niceCeiling(value: number) {
  if (value <= 0) return 100_000
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

function segmentHeight(value: number, chartMaximum: number) {
  if (value <= 0) return '0%'
  return `${Math.max((value / chartMaximum) * 100, 3)}%`
}

export function TaxHorizonChart({ timeline, currency }: { timeline: TimelineMonth[]; currency: string }) {
  const [selectedKey, setSelectedKey] = useState(
    timeline.find((month) => month.isCurrent)?.key ?? timeline[0]?.key ?? ''
  )

  const amounts = useMemo(() => timeline.map(amountsForMonth), [timeline])
  const maximum = niceCeiling(Math.max(...amounts.map((month) => month.total), 0))
  const selectedIndex = Math.max(timeline.findIndex((month) => month.key === selectedKey), 0)
  const selected = timeline[selectedIndex]
  const selectedAmounts = amounts[selectedIndex]

  const totals = amounts.reduce(
    (result, month) => ({
      vat: result.vat + month.vat + month.projectedVat,
      prepayment: result.prepayment + month.prepayment,
      priorYear: result.priorYear + month.priorYear,
    }),
    { vat: 0, prepayment: 0, priorYear: 0 }
  )

  return (
    <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-fmea-border dark:bg-fmea-bg2">
      <div className="flex flex-col gap-4 border-b border-stone-100 px-5 py-5 dark:border-fmea-border sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-fmea-accent">12-month outlook</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-fmea-hi">When the money leaves</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-fmea-dim">Select a month to see every payment behind the graph.</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-600 dark:text-fmea-text" aria-label="Tax payment categories">
          <Legend colour="bg-cyan-500 shadow-sm shadow-cyan-500/40" label="MwSt" />
          <Legend colour="bg-violet-600 shadow-sm shadow-violet-500/40" label="ESt pre-payment" />
          <Legend colour="bg-rose-600 shadow-sm shadow-rose-500/40" label="Prior-year catch-up" />
          <Legend colour="bg-slate-500" label="Other" />
        </div>
      </div>

      <div className="grid gap-3 border-b border-stone-100 bg-stone-50/60 px-5 py-4 dark:border-fmea-border dark:bg-fmea-bg3/30 sm:grid-cols-3 sm:px-6">
        <TotalBand colour="cyan" label="MwSt in this horizon" value={money(totals.vat, currency)} detail="Known and projected" />
        <TotalBand colour="violet" label="Quarterly pre-payments" value={money(totals.prepayment, currency)} detail="Current income-tax schedule" />
        <TotalBand colour="rose" label="Prior-year catch-up" value={money(totals.priorYear, currency)} detail="Balance due after assessment" />
      </div>

      <div className="overflow-x-auto px-4 pb-2 pt-6 sm:px-6">
        <div className="min-w-[1040px]">
          <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
            <div className="relative h-72 text-right text-[10px] font-medium tabular-nums text-slate-400 dark:text-slate-300" aria-hidden="true">
              {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
                <span key={ratio} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - ratio) * 100}%` }}>
                  {money(maximum * ratio, currency, true)}
                </span>
              ))}
            </div>

            <div className="relative h-72 border-b border-slate-300 dark:border-slate-500">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <div key={ratio} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-stone-200 dark:border-slate-600/80" style={{ top: `${ratio * 100}%` }} />
              ))}
              <div className="absolute inset-0 grid grid-cols-12 gap-2">
                {timeline.map((month, index) => {
                  const monthAmounts = amounts[index]
                  const selectedMonth = month.key === selectedKey
                  const urgent = month.items.some((item) => item.displayStatus === 'OVERDUE' || item.displayStatus === 'URGENT')
                  return (
                    <button
                      key={month.key}
                      type="button"
                      onClick={() => setSelectedKey(month.key)}
                      className={cn(
                        'group relative flex h-full items-end justify-center rounded-t-xl px-1 outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-fmea-bg2',
                        selectedMonth && 'bg-cyan-50/90 dark:bg-cyan-900/30',
                        month.isPast && !selectedMonth && 'opacity-75'
                      )}
                      aria-label={`${month.label}: ${money(monthAmounts.total, currency)}`}
                      aria-pressed={selectedMonth}
                    >
                      {month.isCurrent && <span className="absolute inset-x-1 top-2 rounded-full bg-cyan-800 px-1 py-1 text-[9px] font-bold uppercase tracking-wider text-white dark:bg-fmea-accent dark:text-fmea-bg">Now</span>}
                      {urgent && <span className="absolute right-1 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-950" title="Urgent or overdue payment" />}
                      {monthAmounts.total > 0 && (
                        <div className="relative flex w-full max-w-14 flex-col-reverse overflow-hidden rounded-t-lg shadow-lg ring-1 ring-black/10 transition group-hover:brightness-110 dark:ring-white/20" style={{ height: segmentHeight(monthAmounts.total, maximum) }}>
                          {monthAmounts.vat > 0 && <BarSegment value={monthAmounts.vat} total={monthAmounts.total} className="bg-cyan-500 dark:bg-cyan-500" label={`MwSt ${money(monthAmounts.vat, currency)}`} />}
                          {monthAmounts.projectedVat > 0 && <BarSegment value={monthAmounts.projectedVat} total={monthAmounts.total} className="border-2 border-dashed border-cyan-700 bg-cyan-200 dark:border-cyan-200 dark:bg-cyan-700" label={`Projected MwSt ${money(monthAmounts.projectedVat, currency)}`} />}
                          {monthAmounts.prepayment > 0 && <BarSegment value={monthAmounts.prepayment} total={monthAmounts.total} className="bg-violet-600 dark:bg-violet-500" label={`Income-tax pre-payment ${money(monthAmounts.prepayment, currency)}`} />}
                          {monthAmounts.priorYear > 0 && <BarSegment value={monthAmounts.priorYear} total={monthAmounts.total} className="bg-rose-600 dark:bg-rose-500" label={`Prior-year catch-up ${money(monthAmounts.priorYear, currency)}`} />}
                          {monthAmounts.other > 0 && <BarSegment value={monthAmounts.other} total={monthAmounts.total} className="bg-slate-500 dark:bg-slate-300" label={`Other tax ${money(monthAmounts.other, currency)}`} />}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="ml-[5.25rem] mt-2 grid grid-cols-12 gap-2">
            {timeline.map((month, index) => (
              <button key={month.key} type="button" onClick={() => setSelectedKey(month.key)} className={cn('min-w-0 rounded-lg px-1 py-1.5 text-center transition hover:bg-stone-100 dark:hover:bg-fmea-bg3', month.key === selectedKey ? 'bg-cyan-100 text-cyan-900 dark:bg-cyan-800 dark:text-white' : 'text-slate-500 dark:text-slate-300')}>
                <span className="block text-[11px] font-semibold">{month.label}</span>
                {amounts[index].total > 0 && <span className="mt-0.5 block text-[9px] tabular-nums">{money(amounts[index].total, currency, true)}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selected && selectedAmounts && (
        <div className="m-4 rounded-2xl border border-stone-200 bg-stone-50/80 p-4 dark:border-fmea-border dark:bg-fmea-bg3/40 sm:m-6 sm:p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-950 dark:text-fmea-hi">{selected.label}</h3>
              {selected.isCurrent && <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-800 dark:bg-cyan-950/50 dark:text-fmea-accent">Current month</span>}
            </div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-slate-950 dark:text-fmea-hi">{money(selectedAmounts.total, currency)}</p>
          </div>

          {selected.items.length > 0 || selected.projectedCents > 0 ? (
            <div className="mt-4 grid gap-2 lg:grid-cols-2">
              {selected.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-white bg-white px-3.5 py-3 dark:border-fmea-border dark:bg-fmea-bg2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-fmea-text">{item.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-fmea-dim">Due {dateLabel(item.dueDate)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-950 dark:text-fmea-hi">{money(item.amountCents, currency)}</p>
                    <span className={cn('mt-1 inline-block rounded-full border px-2 py-0.5 text-[9px] font-semibold', STATUS_STYLES[item.displayStatus])}>{STATUS_LABELS[item.displayStatus]}</span>
                  </div>
                </div>
              ))}
              {selected.projectedCents > 0 && (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-cyan-300 bg-cyan-50/70 px-3.5 py-3 dark:border-cyan-900 dark:bg-cyan-950/20">
                  <div><p className="text-sm font-semibold text-cyan-900 dark:text-cyan-200">{selected.projectionLabel || 'Projected MwSt'}</p><p className="mt-0.5 text-xs text-cyan-700/70 dark:text-cyan-300/70">Planning estimate</p></div>
                  <p className="text-sm font-semibold tabular-nums text-cyan-900 dark:text-cyan-200">{money(selected.projectedCents, currency)}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400 dark:text-fmea-dim">No tax payment recorded or projected for this month.</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-stone-100 px-5 py-4 text-xs text-slate-500 dark:border-fmea-border dark:text-fmea-dim sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Solid bars are known amounts. The outlined cyan bar is projected MwSt.</p>
        <p className="font-medium text-rose-600 dark:text-rose-300">Coral marks tax added for a previous year.</p>
      </div>
    </section>
  )
}

function Legend({ colour, label }: { colour: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className={cn('h-2.5 w-2.5 rounded-sm', colour)} />{label}</span>
}

function TotalBand({ colour, label, value, detail }: { colour: 'cyan' | 'violet' | 'rose'; label: string; value: string; detail: string }) {
  const styles = {
    cyan: 'border-cyan-600 bg-cyan-600 text-white shadow-md shadow-cyan-900/10 dark:border-cyan-400 dark:bg-cyan-500 dark:text-slate-950',
    violet: 'border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-900/10 dark:border-violet-400 dark:bg-violet-500 dark:text-white',
    rose: 'border-rose-600 bg-rose-600 text-white shadow-md shadow-rose-900/10 dark:border-rose-400 dark:bg-rose-500 dark:text-white',
  }[colour]
  return <div className={cn('rounded-2xl border px-4 py-3.5', styles)}><p className="text-[10px] font-bold uppercase tracking-[0.13em] opacity-65">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p><p className="mt-0.5 text-[10px] opacity-60">{detail}</p></div>
}

function BarSegment({ value, total, className, label }: { value: number; total: number; className: string; label: string }) {
  return <span className={cn('block min-h-[5px] w-full', className)} style={{ height: `${(value / total) * 100}%` }} title={label} />
}
