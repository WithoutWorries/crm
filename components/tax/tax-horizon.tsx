'use client'

import Link from 'next/link'
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownToLine,
  Banknote,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileCheck2,
  FileUp,
  Landmark,
  Loader2,
  LockKeyhole,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RemittanceUploadDialog } from '@/components/tax/remittance-upload-dialog'
import { IncomeHistoryChart } from '@/components/tax/income-history-chart'
import { TaxHorizonChart } from '@/components/tax/tax-horizon-chart'
import { WorkYearSection } from '@/components/tax/work-year-section'
import { reconcileRemittance } from '@/lib/remittance-reconciliation'

type VatFrequency = 'UNKNOWN' | 'MONTHLY' | 'QUARTERLY'
type LiabilityType = 'VAT' | 'INCOME_TAX_PREPAYMENT' | 'PRIOR_YEAR_SETTLEMENT' | 'OTHER'
type DisplayStatus = 'PAID' | 'OVERDUE' | 'URGENT' | 'DUE_SOON' | 'ESTIMATED' | 'NOTICE_RECEIVED'

interface Liability {
  id: string
  label: string
  type: LiabilityType
  source: 'CALCULATED' | 'ESTIMATE' | 'TAX_NOTICE' | 'ADVISER'
  status: 'ESTIMATED' | 'NOTICE_RECEIVED' | 'PAID'
  displayStatus: DisplayStatus
  amountCents: number
  dueDate: string
  noticeDate: string | null
  paidAt: string | null
  taxYear: number | null
  periodKey: string | null
  notes: string | null
  hasPaymentEvidence: boolean
}

export interface TaxDashboardData {
  profile: {
    bankBalanceCents: number
    currency: string
    reportingStartYear: number
    vatFilingFrequency: VatFrequency
    hasPermanentExtension: boolean
  }
  metrics: {
    bankBalanceCents: number
    reservedCents: number
    safeToSpendCents: number
    vatReserveCents: number
    nextIncomeTaxCents: number
  }
  urgent: Liability[]
  timeline: Array<{
    key: string
    label: string
    isPast: boolean
    isCurrent: boolean
    knownCents: number
    projectedCents: number
    items: Array<{
      id: string
      label: string
      type: LiabilityType
      amountCents: number
      dueDate: string
      status: 'ESTIMATED' | 'NOTICE_RECEIVED' | 'PAID'
      displayStatus: DisplayStatus
    }>
    projectionLabel: string | null
  }>
  liabilities: Liability[]
  earnings: {
    year: number
    revenueExVatCents: number
    grossCashReceivedCents: number
    businessCostsCents: number
    recordedResultCents: number
    unconfirmedCashCount: number
    months: Array<{
      key: string
      label: string
      isCurrent: boolean
      revenueExVatCents: number
      grossCashReceivedCents: number
      businessCostsCents: number
      recordedResultCents: number
    }>
  }
  taxPayments: Array<{
    id: string
    taxLiabilityId: string | null
    type: LiabilityType
    periodKey: string | null
    periodLabel: string
    calculatedCents: number
    advisedCents: number
    paidCents: number
    paidAt: string
    source: 'ADVISER' | 'TAX_NOTICE' | 'ELSTER' | 'MANUAL'
    settlesPeriod: boolean
    notes: string | null
  }>
  recentEntries: Array<{
    id: string
    type: 'ISSUED_INVOICE' | 'CLIENT_REMITTANCE' | 'EXPENSE_VAT'
    description: string | null
    reference: string | null
    netCents: number
    vatCents: number
    grossCents: number
    effectiveVatCents: number
    effectiveGrossCents: number
    bankedGrossCents: number | null
    adjustmentCents: number | null
    reconciliationStatus: 'PENDING' | 'BANK_AMOUNT_UNCONFIRMED' | 'MATCHED' | 'CASH_DISCOUNT' | 'UNEXPLAINED_DIFFERENCE'
    cashDiscountRate: number | null
    cashDiscountDays: number | null
    reconciliationNote: string | null
    vatRate: number | null
    documentDate: string | null
    expectedPaymentDate: string | null
    paymentDate: string | null
    clientCalculated: boolean
    aiExtracted: boolean
    workSessionCount: number
  }>
  calculationNote: string
}

type Dialog = 'income' | 'remittance' | 'remittance-upload' | 'expense' | 'liability' | 'settings' | 'payment' | 'tax-payment' | 'reference' | null
type LiabilityTab = 'current' | 'upcoming' | 'prior'

const FIELD =
  'mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100 dark:border-fmea-border dark:bg-fmea-bg3 dark:text-fmea-hi dark:focus:border-fmea-accent dark:focus:ring-cyan-950/60'
const LABEL = 'block text-xs font-semibold text-slate-600 dark:text-fmea-dim'

const STATUS_STYLE: Record<DisplayStatus, { label: string; className: string }> = {
  PAID: {
    label: 'Paid',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300',
  },
  OVERDUE: {
    label: 'Overdue',
    className: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300',
  },
  URGENT: {
    label: 'Due within 7 days',
    className: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300',
  },
  DUE_SOON: {
    label: 'Due within 30 days',
    className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300',
  },
  ESTIMATED: {
    label: 'Estimated',
    className: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-fmea-border dark:bg-fmea-bg3 dark:text-fmea-dim',
  },
  NOTICE_RECEIVED: {
    label: 'Notice received',
    className: 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/70 dark:bg-cyan-950/30 dark:text-cyan-300',
  },
}

const LIABILITY_LABELS: Record<LiabilityType, string> = {
  VAT: 'VAT / MwSt',
  INCOME_TAX_PREPAYMENT: 'Income tax pre-payment',
  PRIOR_YEAR_SETTLEMENT: 'Prior-year settlement',
  OTHER: 'Other tax liability',
}

function money(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
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

function todayInput() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

async function jsonRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Unable to save the change')
  return data
}

function Modal({ title, description, onClose, children }: {
  title: string
  description: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/60 bg-[#fdfdfc] shadow-2xl dark:border-fmea-border dark:bg-fmea-bg2 sm:max-w-xl sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="tax-dialog-title">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-stone-200 bg-[#fdfdfc]/95 px-5 py-5 backdrop-blur dark:border-fmea-border dark:bg-fmea-bg2/95 sm:px-6">
          <div>
            <h2 id="tax-dialog-title" className="text-xl font-semibold text-slate-950 dark:text-fmea-hi">{title}</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-fmea-dim">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="ml-4 rounded-xl p-2 text-slate-400 hover:bg-stone-100 hover:text-slate-700 dark:hover:bg-fmea-bg3 dark:hover:text-fmea-text" aria-label="Close dialog">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  )
}

function SubmitButton({ saving, children }: { saving: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-900 disabled:cursor-wait disabled:opacity-60 dark:bg-fmea-accent dark:text-fmea-bg dark:hover:bg-cyan-300">
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      {children}
    </button>
  )
}

export function TaxHorizon({ initialData }: { initialData?: TaxDashboardData }) {
  const [data, setData] = useState<TaxDashboardData | null>(initialData ?? null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [tab, setTab] = useState<LiabilityTab>('current')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [removingEntryId, setRemovingEntryId] = useState<string | null>(null)
  const [removingLiabilityId, setRemovingLiabilityId] = useState<string | null>(null)
  const [voidingPaymentId, setVoidingPaymentId] = useState<string | null>(null)
  const [selectedRemittanceId, setSelectedRemittanceId] = useState<string | null>(null)
  const [selectedLiabilityId, setSelectedLiabilityId] = useState<string | null>(null)

  const load = async () => {
    try {
      setError('')
      const result = await jsonRequest('/api/tax/dashboard', { cache: 'no-store' })
      setData(result)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load Tax Horizon')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialData) void load()
  }, [initialData])

  const visibleLiabilities = useMemo(() => {
    if (!data) return []
    const today = todayInput()
    const inThirtyDays = new Date(`${today}T12:00:00.000Z`)
    inThirtyDays.setUTCDate(inThirtyDays.getUTCDate() + 30)
    const cutoff = inThirtyDays.toISOString().slice(0, 10)
    if (tab === 'prior') return data.liabilities.filter((item) => item.type === 'PRIOR_YEAR_SETTLEMENT')
    if (tab === 'upcoming') return data.liabilities.filter((item) => item.status !== 'PAID' && item.dueDate > cutoff)
    return data.liabilities.filter((item) => item.type !== 'PRIOR_YEAR_SETTLEMENT' && (item.dueDate <= cutoff || item.status === 'PAID'))
  }, [data, tab])

  const openTaxPayment = (liability: Liability) => {
    setSelectedLiabilityId(liability.id)
    setDialog('tax-payment')
  }

  const voidTaxPayment = async (paymentId: string) => {
    if (!window.confirm('Void this payment record? The liability will be recalculated and the original evidence will remain in the audit log.')) return
    setVoidingPaymentId(paymentId)
    try {
      await jsonRequest(`/api/tax/payments/${paymentId}`, { method: 'DELETE' })
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to void the tax payment')
    } finally {
      setVoidingPaymentId(null)
    }
  }

  const removeEntry = async (entryId: string) => {
    if (!window.confirm('Remove this cash entry and recalculate the VAT reserve?')) return
    setRemovingEntryId(entryId)
    try {
      await jsonRequest(`/api/tax/entries/${entryId}`, { method: 'DELETE' })
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to remove the cash entry')
    } finally {
      setRemovingEntryId(null)
    }
  }

  const removeLiability = async (liability: Liability) => {
    if (!window.confirm(`Remove “${liability.label}” from Tax Horizon?`)) return
    setRemovingLiabilityId(liability.id)
    try {
      await jsonRequest(`/api/tax/liabilities/${liability.id}`, { method: 'DELETE' })
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to remove the liability')
    } finally {
      setRemovingLiabilityId(null)
    }
  }

  if (loading) {
    return <div className="flex min-h-[55vh] items-center justify-center text-slate-500 dark:text-fmea-dim"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading Tax Horizon…</div>
  }

  if (!data) {
    return <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-700"><h1 className="text-xl font-semibold">Tax Horizon could not be loaded</h1><p className="mt-2 text-sm">{error}</p><button onClick={() => { setLoading(true); void load() }} className="mt-5 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white">Try again</button></div>
  }

  const currency = data.profile.currency
  const firstUrgent = data.urgent[0]

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      {firstUrgent && (
        <section className="flex flex-col gap-4 rounded-2xl border border-rose-300 bg-rose-600 px-5 py-4 text-white shadow-lg shadow-rose-900/10 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">{data.urgent.length > 1 ? `${data.urgent.length} tax payments need attention` : `${firstUrgent.label} needs attention`}</p>
              <p className="mt-0.5 text-sm text-rose-50">{money(firstUrgent.amountCents, currency)} · due {dateLabel(firstUrgent.dueDate)}</p>
            </div>
          </div>
          <button type="button" onClick={() => openTaxPayment(firstUrgent)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50">
            <Check className="h-4 w-4" /> Record payment
          </button>
        </section>
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-fmea-accent"><Landmark className="h-4 w-4" />Financial control</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-fmea-hi sm:text-4xl">Tax Horizon</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-fmea-dim">What is owed, when it is due, and how much cash is actually available.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/30 dark:text-violet-300"><LockKeyhole className="h-3.5 w-3.5" />Private to you</span>
          <button type="button" onClick={() => setDialog('settings')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:border-cyan-500 dark:border-fmea-border dark:bg-fmea-bg2 dark:text-fmea-text"><Settings2 className="h-4 w-4" />Settings</button>
        </div>
      </header>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={WalletCards} label="Total bank balance" value={money(data.metrics.bankBalanceCents, currency)} detail="Manually maintained" tone="slate" action={<button onClick={() => setDialog('settings')} className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 dark:text-fmea-accent">Update balance</button>} />
        <MetricCard icon={ShieldCheck} label="Reserved for tax" value={money(data.metrics.reservedCents, currency)} detail={`${money(data.metrics.vatReserveCents, currency)} VAT · ${money(data.metrics.nextIncomeTaxCents, currency)} next ESt`} tone="amber" />
        <MetricCard icon={CircleDollarSign} label="Safe to spend" value={money(data.metrics.safeToSpendCents, currency)} detail="Bank balance less the current reserve" tone={data.metrics.safeToSpendCents < 0 ? 'rose' : 'cyan'} hero />
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-fmea-border dark:bg-fmea-bg2 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-fmea-accent">Recorded earnings {data.earnings.year}</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-fmea-hi">What the current records show</h2>
          </div>
          <p className="max-w-xl text-xs leading-5 text-slate-400 dark:text-fmea-dim">Payment-date view. Figures are only as complete as the income and business costs recorded here.</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <EarningsMetric label="Net revenue" value={money(data.earnings.revenueExVatCents, currency)} detail="Income excluding VAT" tone="cyan" />
          <EarningsMetric label="Gross cash received" value={money(data.earnings.grossCashReceivedCents, currency)} detail={data.earnings.unconfirmedCashCount ? `${data.earnings.unconfirmedCashCount} bank amount${data.earnings.unconfirmedCashCount === 1 ? '' : 's'} not yet counted` : 'Bank receipts including VAT'} tone="blue" />
          <EarningsMetric label="Business costs" value={money(data.earnings.businessCostsCents, currency)} detail="Recorded costs excluding VAT" tone="amber" />
          <EarningsMetric label="Recorded result" value={money(data.earnings.recordedResultCents, currency)} detail="Net revenue less recorded costs" tone={data.earnings.recordedResultCents < 0 ? 'rose' : 'violet'} />
        </div>
      </section>

      <TaxHorizonChart timeline={data.timeline} currency={currency} />

      <IncomeHistoryChart months={data.earnings.months} currency={currency} />

      <WorkYearSection reportingStartYear={data.profile.reportingStartYear} refreshKey={data.recentEntries.map((entry) => entry.id).join(':') || 'none'} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.55fr)]">
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-fmea-border dark:bg-fmea-bg2">
          <div className="border-b border-stone-100 px-5 pt-5 dark:border-fmea-border sm:px-6">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-fmea-hi">Liabilities</h2>
            <div className="mt-4 flex gap-1 overflow-x-auto" role="tablist">
              {([['current', 'Current obligations'], ['upcoming', 'Upcoming horizon'], ['prior', 'Prior-year demands']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value)} className={cn('whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold transition', tab === value ? 'border-cyan-700 text-cyan-800 dark:border-fmea-accent dark:text-fmea-accent' : 'border-transparent text-slate-400 hover:text-slate-700 dark:text-fmea-dim')}>{label}</button>)}
            </div>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-fmea-border">
            {visibleLiabilities.length ? visibleLiabilities.map((liability) => {
              const status = STATUS_STYLE[liability.displayStatus]
              return <article key={liability.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-semibold text-slate-900 dark:text-fmea-hi">{liability.label}</h3><span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', status.className)}>{status.label}</span></div><p className="mt-1 text-xs text-slate-500 dark:text-fmea-dim">{LIABILITY_LABELS[liability.type]} · due {dateLabel(liability.dueDate)} · {liability.source === 'CALCULATED' ? 'calculated from cash entries' : liability.source === 'TAX_NOTICE' ? 'tax notice' : liability.source.toLowerCase()}</p></div>
                <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end"><p className="text-base font-semibold tabular-nums text-slate-950 dark:text-fmea-hi">{money(liability.amountCents, currency)}</p>{liability.status !== 'PAID' ? <button type="button" onClick={() => openTaxPayment(liability)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300"><Check className="h-3.5 w-3.5" /> Record payment</button> : liability.hasPaymentEvidence ? <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">Payment recorded</span> : <button type="button" disabled={savingId === liability.id} onClick={async () => { setSavingId(liability.id); try { await jsonRequest(`/api/tax/liabilities/${liability.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reopen' }) }); await load() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to reopen') } finally { setSavingId(null) } }} className="text-xs font-semibold text-slate-400 hover:text-slate-700 disabled:opacity-50 dark:text-fmea-dim">{savingId === liability.id ? 'Reopening…' : 'Reopen'}</button>}{liability.source !== 'CALCULATED' && !liability.hasPaymentEvidence && <button type="button" onClick={() => void removeLiability(liability)} disabled={removingLiabilityId === liability.id} className="rounded-lg p-1.5 text-stone-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:text-fmea-border dark:hover:bg-rose-950/30 dark:hover:text-rose-300" title="Remove liability" aria-label="Remove liability">{removingLiabilityId === liability.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}</button>}</div>
              </article>
            }) : <div className="px-6 py-14 text-center"><CalendarClock className="mx-auto h-8 w-8 text-stone-300 dark:text-fmea-border" /><p className="mt-3 text-sm font-semibold text-slate-700 dark:text-fmea-text">Nothing in this view</p><p className="mt-1 text-xs text-slate-400 dark:text-fmea-dim">New obligations will appear here as cash and notices are recorded.</p></div>}
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-5 text-white shadow-sm dark:border-fmea-border dark:bg-fmea-nav sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">Quick actions</p><h2 className="mt-1 text-lg font-semibold">Record a change</h2><p className="mt-2 text-sm leading-6 text-slate-300">The tax reserve follows the bank payment date. A client remittance can be recorded earlier.</p>
          <div className="mt-5 space-y-2">
            <QuickAction icon={FileUp} label="Upload remittance PDF" detail="Extract figures, dates and hours" onClick={() => setDialog('remittance-upload')} />
            <QuickAction icon={FileCheck2} label="Record client remittance" detail="Gutschrift · payment may follow" onClick={() => setDialog('remittance')} />
            <QuickAction icon={ArrowDownToLine} label="Log cash received" detail="Issued invoice" onClick={() => setDialog('income')} />
            <QuickAction icon={ReceiptText} label="Log expense VAT" detail="Vorsteuer" onClick={() => setDialog('expense')} />
            <QuickAction icon={CalendarClock} label="Enter tax notice" detail="Pre-payment or demand" onClick={() => setDialog('liability')} />
          </div>
          <div className="mt-6 border-t border-slate-700 pt-5"><div className="flex items-start gap-2 text-xs leading-5 text-slate-400"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /><p>{data.calculationNote}</p></div></div>
        </aside>
      </section>

      {data.taxPayments.length > 0 && (
        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-fmea-border dark:bg-fmea-bg2 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Payment evidence</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-fmea-hi">Tax payments recorded</h2>
              <p className="mt-1 text-xs leading-5 text-slate-400 dark:text-fmea-dim">Calculated, advised and bank-paid amounts remain separate so a difference can be explained later.</p>
            </div>
            <a href={`/api/tax/payment-export?year=${data.earnings.year}`} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300"><Download className="h-4 w-4" />{data.earnings.year} payments CSV</a>
          </div>
          <div className="mt-4 divide-y divide-stone-100 dark:divide-fmea-border">
            {data.taxPayments.map((payment) => {
              const calculationVariance = payment.advisedCents - payment.calculatedCents
              const bankVariance = payment.paidCents - payment.advisedCents
              return (
                <article key={payment.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-fmea-hi">{payment.periodLabel}</h3>
                      <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', payment.settlesPeriod ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300')}>{payment.settlesPeriod ? 'Period settled' : 'Partial payment'}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-fmea-dim">Paid {dateLabel(payment.paidAt)} · {payment.source === 'ADVISER' ? 'accountant advice' : payment.source === 'TAX_NOTICE' ? 'tax notice' : payment.source === 'ELSTER' ? 'ELSTER filing' : 'manual record'}</p>
                    {(calculationVariance !== 0 || bankVariance !== 0) && <p className="mt-1 text-xs font-medium text-violet-700 dark:text-violet-300">App {money(payment.calculatedCents, currency)} · advised {money(payment.advisedCents, currency)}{bankVariance !== 0 ? ` · bank difference ${money(bankVariance, currency)}` : ''}</p>}
                    {payment.notes && <p className="mt-1 text-xs text-slate-400 dark:text-fmea-dim">{payment.notes}</p>}
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                    <p className="text-base font-semibold tabular-nums text-slate-950 dark:text-fmea-hi">{money(payment.paidCents, currency)}</p>
                    <button type="button" onClick={() => void voidTaxPayment(payment.id)} disabled={voidingPaymentId === payment.id} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:text-fmea-dim dark:hover:bg-rose-950/30 dark:hover:text-rose-300">{voidingPaymentId === payment.id ? 'Voiding…' : 'Void'}</button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {data.recentEntries.length > 0 && (
        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-fmea-border dark:bg-fmea-bg2 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-fmea-accent">Audit trail</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-fmea-hi">Recent records</h2>
            </div>
            <Link href="/tax/remittances" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-2 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-100 dark:border-cyan-900/70 dark:bg-cyan-950/30 dark:text-cyan-200">
              <Banknote className="h-4 w-4" />All remittances<ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4 grid gap-2 lg:grid-cols-2">
            {data.recentEntries.slice(0, 6).map((entry) => {
              const paymentPending = entry.type === 'CLIENT_REMITTANCE' && !entry.paymentDate
              const fallbackLabel = entry.description || (entry.type === 'EXPENSE_VAT' ? 'Business expense' : entry.type === 'CLIENT_REMITTANCE' ? 'Client remittance' : 'Issued invoice')
              return (
                <div key={entry.id} className="flex flex-col gap-3 rounded-2xl border border-stone-100 bg-stone-50/70 px-4 py-3 dark:border-fmea-border dark:bg-fmea-bg3/50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-fmea-text">
                      {entry.reference ? `Document ${entry.reference}` : fallbackLabel}
                      </p>
                      {paymentPending && <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">Payment pending</span>}
                      {entry.reconciliationStatus === 'CASH_DISCOUNT' && <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[9px] font-semibold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300">Cash discount matched</span>}
                      {entry.reconciliationStatus === 'UNEXPLAINED_DIFFERENCE' && <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">Difference to resolve</span>}
                      {entry.reconciliationStatus === 'BANK_AMOUNT_UNCONFIRMED' && <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">Bank amount unconfirmed</span>}
                    </div>
                    {entry.type === 'CLIENT_REMITTANCE' && <button type="button" onClick={() => { setSelectedRemittanceId(entry.id); setDialog('reference') }} className={cn('mt-1 text-[10px] font-semibold hover:underline', entry.reference ? 'text-slate-400 dark:text-fmea-dim' : 'rounded-md bg-amber-100 px-2 py-1 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300')}>{entry.reference ? 'Correct document number' : 'Add document number'}</button>}
                    {entry.reference && entry.description && <p className="mt-1 truncate text-xs font-medium text-slate-600 dark:text-fmea-text">{entry.description}</p>}
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-fmea-dim">
                      {entry.paymentDate
                        ? `${dateLabel(entry.paymentDate)} · VAT ${money(entry.effectiveVatCents, currency)}`
                        : `Remittance ${entry.documentDate ? dateLabel(entry.documentDate) : 'date not recorded'}${entry.expectedPaymentDate ? ` · expected ${dateLabel(entry.expectedPaymentDate)}` : ''} · VAT not yet reserved`}
                      {entry.clientCalculated ? ' · client calculated' : ''}
                      {entry.aiExtracted ? ' · AI reviewed' : ''}
                      {entry.workSessionCount ? ` · ${entry.workSessionCount} work dates` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                    <p className={cn('text-sm font-semibold tabular-nums', entry.type === 'EXPENSE_VAT' ? 'text-rose-600 dark:text-rose-300' : paymentPending ? 'text-amber-700 dark:text-amber-300' : 'text-slate-900 dark:text-fmea-hi')}>
                      {entry.type === 'EXPENSE_VAT' ? '−' : paymentPending ? 'Expected ' : '+'}{money(entry.type === 'CLIENT_REMITTANCE' && entry.paymentDate ? entry.effectiveGrossCents : entry.grossCents, currency)}
                    </p>
                    {paymentPending && (
                      <button type="button" onClick={() => { setSelectedRemittanceId(entry.id); setDialog('payment') }} className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-[10px] font-semibold text-cyan-800 hover:bg-cyan-100 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-300">
                        Record payment
                      </button>
                    )}
                    <button type="button" onClick={() => void removeEntry(entry.id)} disabled={removingEntryId === entry.id} className="rounded-lg p-1.5 text-stone-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:text-fmea-border dark:hover:bg-rose-950/30 dark:hover:text-rose-300" title="Remove cash entry" aria-label="Remove cash entry">
                      {removingEntryId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {(dialog === 'income' || dialog === 'remittance' || dialog === 'expense') && <EntryDialog mode={dialog} onClose={() => setDialog(null)} onSaved={async () => { setDialog(null); await load() }} />}
      {dialog === 'remittance-upload' && <RemittanceUploadDialog onClose={() => setDialog(null)} onSaved={async () => { setDialog(null); await load() }} />}
      {dialog === 'liability' && <LiabilityDialog onClose={() => setDialog(null)} onSaved={async () => { setDialog(null); await load() }} />}
      {dialog === 'settings' && <SettingsDialog profile={data.profile} onClose={() => setDialog(null)} onSaved={async () => { setDialog(null); await load() }} />}
      {dialog === 'tax-payment' && selectedLiabilityId && <TaxPaymentDialog liability={data.liabilities.find((liability) => liability.id === selectedLiabilityId)!} currency={currency} onClose={() => { setDialog(null); setSelectedLiabilityId(null) }} onSaved={async () => { setDialog(null); setSelectedLiabilityId(null); await load() }} />}
      {dialog === 'payment' && selectedRemittanceId && <PaymentDialog entry={data.recentEntries.find((entry) => entry.id === selectedRemittanceId)!} onClose={() => { setDialog(null); setSelectedRemittanceId(null) }} onSaved={async () => { setDialog(null); setSelectedRemittanceId(null); await load() }} />}
      {dialog === 'reference' && selectedRemittanceId && <ReferenceDialog entryId={selectedRemittanceId} initialReference={data.recentEntries.find((entry) => entry.id === selectedRemittanceId)?.reference ?? ''} onClose={() => { setDialog(null); setSelectedRemittanceId(null) }} onSaved={async () => { setDialog(null); setSelectedRemittanceId(null); await load() }} />}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, detail, tone, hero = false, action }: { icon: typeof WalletCards; label: string; value: string; detail: string; tone: 'slate' | 'amber' | 'cyan' | 'rose'; hero?: boolean; action?: ReactNode }) {
  const styles = { slate: 'border-stone-200 bg-white dark:border-fmea-border dark:bg-fmea-bg2', amber: 'border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20', cyan: 'border-cyan-300 bg-cyan-800 text-white shadow-lg shadow-cyan-900/10 dark:border-fmea-accent dark:bg-fmea-accent dark:text-fmea-bg', rose: 'border-rose-300 bg-rose-700 text-white dark:border-rose-800 dark:bg-rose-950' }[tone]
  const inverted = tone === 'cyan' || tone === 'rose'
  return <div className={cn('rounded-3xl border p-5 sm:p-6', styles, hero && 'md:-translate-y-1')}><div className="flex items-start justify-between"><div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', inverted ? 'bg-white/15' : tone === 'amber' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-fmea-bg3 dark:text-fmea-dim')}><Icon className="h-5 w-5" /></div>{action}</div><p className={cn('mt-5 text-xs font-semibold uppercase tracking-[0.12em]', inverted ? 'text-white/75' : 'text-slate-400 dark:text-fmea-dim')}>{label}</p><p className={cn('mt-1 font-semibold tracking-tight tabular-nums', hero ? 'text-4xl' : 'text-3xl', inverted ? '' : 'text-slate-950 dark:text-fmea-hi')}>{value}</p><p className={cn('mt-2 text-xs', inverted ? 'text-white/70' : 'text-slate-500 dark:text-fmea-dim')}>{detail}</p></div>
}

function EarningsMetric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'cyan' | 'blue' | 'amber' | 'violet' | 'rose' }) {
  const styles = {
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-950 dark:border-cyan-800 dark:bg-cyan-950/35 dark:text-cyan-100',
    blue: 'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/35 dark:text-blue-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100',
    violet: 'border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950/35 dark:text-violet-100',
    rose: 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/35 dark:text-rose-100',
  }[tone]
  return <div className={cn('rounded-2xl border p-4', styles)}><p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-65">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p><p className="mt-1 text-[11px] opacity-65">{detail}</p></div>
}

function QuickAction({ icon: Icon, label, detail, onClick }: { icon: typeof ArrowDownToLine; label: string; detail: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="group flex w-full items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800/70 p-3.5 text-left transition hover:border-cyan-400 hover:bg-slate-800"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-cyan-300"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-white">{label}</span><span className="mt-0.5 block text-xs text-slate-400">{detail}</span></span><ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" /></button>
}

function EntryDialog({ mode, onClose, onSaved }: { mode: 'income' | 'remittance' | 'expense'; onClose: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [net, setNet] = useState('')
  const [vat, setVat] = useState('')
  const [gross, setGross] = useState('')
  const [vatRate, setVatRate] = useState('19')
  const isInvoice = mode === 'income'
  const isExpense = mode === 'expense'
  const isRemittance = mode === 'remittance'
  const title = isInvoice ? 'Log cash received' : isExpense ? 'Log expense VAT' : 'Record client remittance'
  const description = isInvoice
    ? 'Record the date the invoice was actually paid.'
    : isExpense
      ? 'Record deductible VAT from a paid business expense.'
      : 'Record the Gutschrift now. Add the bank payment later if it has not arrived yet.'
  const preview = isInvoice && net ? Number(net.replace(',', '.')) * (1 + Number(vatRate) / 100) : null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError('')
    const form = new FormData(event.currentTarget)
    try {
      await jsonRequest('/api/tax/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: isInvoice ? 'ISSUED_INVOICE' : isExpense ? 'EXPENSE_VAT' : 'CLIENT_REMITTANCE',
          documentDate: isRemittance ? form.get('documentDate') : undefined,
          expectedPaymentDate: isRemittance ? form.get('expectedPaymentDate') : undefined,
          paymentDate: form.get('paymentDate'),
          bankedGrossAmount: isRemittance ? form.get('bankedGrossAmount') : undefined,
          cashDiscountRate: isRemittance ? form.get('cashDiscountRate') : undefined,
          cashDiscountDays: isRemittance ? form.get('cashDiscountDays') : undefined,
          reconciliationNote: isRemittance ? form.get('reconciliationNote') : undefined,
          netAmount: net,
          vatAmount: isInvoice ? undefined : vat,
          grossAmount: isRemittance ? gross : undefined,
          vatRate: isInvoice ? Number(vatRate) : undefined,
          description: form.get('description'),
          reference: form.get('reference'),
        }),
      })
      await onSaved()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save') } finally { setSaving(false) }
  }

  return (
    <Modal title={title} description={description} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {isRemittance ? (
            <>
              <label className={LABEL}>Remittance date<input className={FIELD} name="documentDate" type="date" defaultValue={todayInput()} required /></label>
              <label className={LABEL}>Expected payment <span className="font-normal text-slate-400">(optional)</span><input className={FIELD} name="expectedPaymentDate" type="date" /></label>
              <label className={LABEL}>Payment received <span className="font-normal text-slate-400">(optional)</span><input className={FIELD} name="paymentDate" type="date" /></label>
              <label className={LABEL}>Amount received by bank <span className="font-normal text-slate-400">(required with payment)</span><input className={FIELD} name="bankedGrossAmount" inputMode="decimal" placeholder="Check the statement" /></label>
            </>
          ) : (
            <label className={LABEL}>Payment date<input className={FIELD} name="paymentDate" type="date" defaultValue={todayInput()} required /></label>
          )}
          <label className={LABEL}>{isRemittance ? 'Document / invoice number' : <>Reference <span className="font-normal text-slate-400">(optional)</span></>}<input className={FIELD} name="reference" maxLength={120} placeholder={isRemittance ? 'Enter exactly as printed' : 'Invoice or client reference'} required={isRemittance} /></label>
        </div>
        {isRemittance && <p className="-mt-2 text-xs leading-5 text-slate-500 dark:text-fmea-dim">Leave both payment fields blank until the money reaches the bank. The banked amount is checked against the stated gross.</p>}
        <label className={LABEL}>Description <span className="font-normal text-slate-400">(optional)</span><input className={FIELD} name="description" maxLength={500} placeholder={isExpense ? 'Software, travel, equipment…' : 'Client or work package'} /></label>
        <div className={cn('grid gap-4', isRemittance ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
          <label className={LABEL}>{isRemittance ? 'Stated net (€)' : 'Net amount (€)'}<input className={FIELD} value={net} onChange={(event) => setNet(event.target.value)} inputMode="decimal" placeholder="0.00" required /></label>
          {isInvoice ? (
            <label className={LABEL}>VAT rate<select className={FIELD} value={vatRate} onChange={(event) => setVatRate(event.target.value)}><option value="19">19%</option><option value="7">7%</option><option value="0">0%</option></select></label>
          ) : (
            <label className={LABEL}>{isRemittance ? 'Stated VAT (€)' : 'VAT amount (€)'}<input className={FIELD} value={vat} onChange={(event) => setVat(event.target.value)} inputMode="decimal" placeholder="0.00" required /></label>
          )}
          {isRemittance && <label className={LABEL}>Stated gross (€)<input className={FIELD} value={gross} onChange={(event) => setGross(event.target.value)} inputMode="decimal" placeholder="0.00" required /></label>}
        </div>
        {isRemittance && <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900/60 dark:bg-violet-950/20"><p className="text-xs font-semibold text-violet-900 dark:text-violet-200">Cash discount terms</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><label className={LABEL}>Discount (%) <span className="font-normal text-slate-400">(optional)</span><input className={FIELD} name="cashDiscountRate" inputMode="decimal" placeholder="e.g. 1.5" /></label><label className={LABEL}>Within days <span className="font-normal text-slate-400">(optional)</span><input className={FIELD} name="cashDiscountDays" type="number" min="1" max="365" placeholder="e.g. 14" /></label></div><label className={`${LABEL} mt-4`}>Reconciliation note <span className="font-normal text-slate-400">(optional)</span><textarea className={cn(FIELD, 'min-h-20 resize-y')} name="reconciliationNote" maxLength={1000} placeholder="Only needed if the banked amount needs explanation." /></label></div>}
        {preview !== null && Number.isFinite(preview) && <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900 dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-200">Calculated gross: <strong>{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(preview)}</strong></div>}
        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end"><SubmitButton saving={saving}>Save entry</SubmitButton></div>
      </form>
    </Modal>
  )
}

function TaxPaymentDialog({ liability, currency, onClose, onSaved }: { liability: Liability; currency: string; onClose: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [advised, setAdvised] = useState((liability.amountCents / 100).toFixed(2))
  const [paid, setPaid] = useState('')
  const [settlesPeriod, setSettlesPeriod] = useState(true)
  const advisedCents = Math.round(Number(advised.replace(',', '.')) * 100)
  const paidCents = Math.round(Number(paid.replace(',', '.')) * 100)
  const adviceVariance = Number.isFinite(advisedCents) ? advisedCents - liability.amountCents : 0
  const bankVariance = Number.isFinite(paidCents) && paidCents > 0 && Number.isFinite(advisedCents)
    ? paidCents - advisedCents
    : null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError('')
    const form = new FormData(event.currentTarget)
    try {
      await jsonRequest(`/api/tax/liabilities/${liability.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markPaid',
          paidAt: form.get('paidAt'),
          periodKey: liability.periodKey,
          periodLabel: form.get('periodLabel'),
          advisedAmount: advised,
          paidAmount: paid,
          paymentSource: form.get('paymentSource'),
          settlesPeriod,
          notes: form.get('notes'),
        }),
      })
      await onSaved()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to record the tax payment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Record tax payment" description="Keep the app calculation, accountant advice and bank payment as separate evidence." onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-3 gap-2">
          <PaymentFigure label="App calculation" value={money(liability.amountCents, currency)} tone="cyan" />
          <PaymentFigure label="Advised / filed" value={Number.isFinite(advisedCents) ? money(advisedCents, currency) : '—'} tone="violet" />
          <PaymentFigure label="Paid by bank" value={Number.isFinite(paidCents) && paidCents > 0 ? money(paidCents, currency) : '—'} tone="emerald" />
        </div>

        <label className={LABEL}>Tax period or payment description<input className={FIELD} name="periodLabel" defaultValue={liability.label} maxLength={160} required /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={LABEL}>Amount advised or filed (€)<input className={FIELD} value={advised} onChange={(event) => setAdvised(event.target.value)} inputMode="decimal" required /></label>
          <label className={LABEL}>Amount paid from bank (€)<input className={FIELD} value={paid} onChange={(event) => setPaid(event.target.value)} inputMode="decimal" placeholder="Check the bank statement" autoFocus required /></label>
          <label className={LABEL}>Payment date<input className={FIELD} name="paidAt" type="date" defaultValue={todayInput()} required /></label>
          <label className={LABEL}>Evidence source<select className={FIELD} name="paymentSource" defaultValue={liability.source === 'TAX_NOTICE' ? 'TAX_NOTICE' : 'ADVISER'}><option value="ADVISER">Accountant advice</option><option value="TAX_NOTICE">Tax notice</option><option value="ELSTER">ELSTER filing</option><option value="MANUAL">My own record</option></select></label>
        </div>

        {(adviceVariance !== 0 || bankVariance !== null && bankVariance !== 0) && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-xs leading-5 text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/25 dark:text-violet-200">
            <p className="font-semibold">Variance recorded, not hidden</p>
            <p className="mt-1">Advice against app calculation: {money(adviceVariance, currency)}{bankVariance !== null ? ` · bank against advice: ${money(bankVariance, currency)}` : ''}</p>
          </div>
        )}

        <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-fmea-border dark:bg-fmea-bg3">
          <input className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600" type="checkbox" checked={settlesPeriod} onChange={(event) => setSettlesPeriod(event.target.checked)} />
          <span><span className="block text-sm font-semibold text-slate-800 dark:text-fmea-text">This is the final payment for the period</span><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-fmea-dim">Untick for a partial payment. The remaining calculated VAT will stay in the reserve.</span></span>
        </label>

        <label className={LABEL}>Accountant or reconciliation note <span className="font-normal text-slate-400">(optional)</span><textarea className={cn(FIELD, 'min-h-20 resize-y')} name="notes" maxLength={2000} placeholder="Enough detail to explain this payment later." /></label>
        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end"><SubmitButton saving={saving}>Record payment</SubmitButton></div>
      </form>
    </Modal>
  )
}

function PaymentFigure({ label, value, tone }: { label: string; value: string; tone: 'cyan' | 'violet' | 'emerald' }) {
  const styles = {
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-900/60 dark:bg-cyan-950/25 dark:text-cyan-200',
    violet: 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/25 dark:text-violet-200',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-200',
  }[tone]
  return <div className={cn('min-w-0 rounded-xl border p-3', styles)}><p className="truncate text-[9px] font-bold uppercase tracking-wide opacity-65">{label}</p><p className="mt-1 truncate text-sm font-semibold tabular-nums">{value}</p></div>
}

function PaymentDialog({ entry, onClose, onSaved }: { entry: TaxDashboardData['recentEntries'][number]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [banked, setBanked] = useState('')
  const [discountRate, setDiscountRate] = useState(entry.cashDiscountRate?.toString() ?? '')
  const bankedCents = Math.round(Number(banked.replace(',', '.')) * 100)
  const parsedDiscountRate = discountRate ? Number(discountRate.replace(',', '.')) : null
  const preview = Number.isFinite(bankedCents) && bankedCents > 0
    ? reconcileRemittance({
        paymentRecorded: true,
        netCents: entry.netCents,
        vatCents: entry.vatCents,
        grossCents: entry.grossCents,
        bankedGrossCents: bankedCents,
        cashDiscountRate: parsedDiscountRate !== null && Number.isFinite(parsedDiscountRate) ? parsedDiscountRate : null,
      })
    : null
  const previewStyle = preview?.status === 'CASH_DISCOUNT'
    ? 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/20 dark:text-violet-200'
    : preview?.status === 'UNEXPLAINED_DIFFERENCE'
      ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200'
      : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200'
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError('')
    const form = new FormData(event.currentTarget)
    try {
      await jsonRequest(`/api/tax/entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recordPayment',
          paymentDate: form.get('paymentDate'),
          bankedGrossAmount: banked,
          cashDiscountRate: discountRate,
          cashDiscountDays: form.get('cashDiscountDays'),
          reconciliationNote: form.get('reconciliationNote'),
        }),
      })
      await onSaved()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to record the payment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Reconcile bank payment" description="Compare the bank receipt with the amount stated on the remittance." onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2"><label className={LABEL}>Payment received date<input className={FIELD} name="paymentDate" type="date" defaultValue={todayInput()} required /></label><label className={LABEL}>Amount received by bank (€)<input className={FIELD} value={banked} onChange={(event) => setBanked(event.target.value)} inputMode="decimal" autoFocus required /></label></div>
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-fmea-border dark:bg-fmea-bg3"><p className="text-xs text-slate-500 dark:text-fmea-dim">Stated gross on remittance</p><p className="mt-1 text-xl font-semibold tabular-nums text-slate-950 dark:text-fmea-hi">{money(entry.grossCents, 'EUR')}</p></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className={LABEL}>Cash discount (%) <span className="font-normal text-slate-400">(if offered)</span><input className={FIELD} value={discountRate} onChange={(event) => setDiscountRate(event.target.value)} inputMode="decimal" placeholder="e.g. 1.5" /></label><label className={LABEL}>Within days <span className="font-normal text-slate-400">(optional)</span><input className={FIELD} name="cashDiscountDays" type="number" min="1" max="365" defaultValue={entry.cashDiscountDays ?? ''} /></label></div>
        {preview && <div className={cn('rounded-2xl border p-4', previewStyle)}><p className="text-xs font-semibold uppercase tracking-[0.1em]">{preview.status === 'MATCHED' ? 'Matched in full' : preview.status === 'CASH_DISCOUNT' ? 'Matched with cash discount' : 'Difference needs explanation'}</p><div className="mt-3 grid grid-cols-3 gap-3 text-xs"><div><span className="block opacity-65">Adjustment</span><strong className="mt-1 block text-sm tabular-nums">{money(preview.adjustmentCents ?? 0, 'EUR')}</strong></div><div><span className="block opacity-65">Effective net</span><strong className="mt-1 block text-sm tabular-nums">{money(preview.effectiveNetCents, 'EUR')}</strong></div><div><span className="block opacity-65">Effective VAT</span><strong className="mt-1 block text-sm tabular-nums">{money(preview.effectiveVatCents, 'EUR')}</strong></div></div>{preview.status === 'UNEXPLAINED_DIFFERENCE' && <p className="mt-3 text-xs leading-5">The stated VAT will remain in the reserve until the difference is resolved.</p>}</div>}
        <label className={LABEL}>Reconciliation note <span className="font-normal text-slate-400">(optional)</span><textarea className={cn(FIELD, 'min-h-20 resize-y')} name="reconciliationNote" defaultValue={entry.reconciliationNote ?? ''} maxLength={1000} placeholder="Record anything your accountant will need to understand." /></label>
        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end"><SubmitButton saving={saving}>Save reconciliation</SubmitButton></div>
      </form>
    </Modal>
  )
}

function ReferenceDialog({ entryId, initialReference, onClose, onSaved }: { entryId: string; initialReference: string; onClose: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError('')
    const form = new FormData(event.currentTarget)
    try {
      await jsonRequest(`/api/tax/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateReference', reference: form.get('reference') }),
      })
      await onSaved()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save the document number')
    } finally {
      setSaving(false)
    }
  }
  return <Modal title="Document / invoice number" description="Enter the primary number exactly as printed on the remittance notice." onClose={onClose}><form onSubmit={submit} className="space-y-5"><label className={LABEL}>Document / invoice number<input className={FIELD} name="reference" defaultValue={initialReference} maxLength={120} placeholder="Enter exactly as printed" autoFocus required /></label>{error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}<div className="flex justify-end"><SubmitButton saving={saving}>Save document number</SubmitButton></div></form></Modal>
}

function LiabilityDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState<Exclude<LiabilityType, 'VAT'>>('INCOME_TAX_PREPAYMENT')
  const [source, setSource] = useState<'TAX_NOTICE' | 'ADVISER' | 'ESTIMATE'>('TAX_NOTICE')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError('')
    const form = new FormData(event.currentTarget)
    try { await jsonRequest('/api/tax/liabilities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, source, status: source === 'TAX_NOTICE' ? 'NOTICE_RECEIVED' : 'ESTIMATED', label: form.get('label'), amount: form.get('amount'), dueDate: form.get('dueDate'), noticeDate: form.get('noticeDate'), taxYear: form.get('taxYear'), notes: form.get('notes') }) }); await onSaved() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save') } finally { setSaving(false) }
  }
  return <Modal title="Enter tax notice or advice" description="Record the amount and due date exactly as issued. This takes precedence over a planning estimate." onClose={onClose}><form onSubmit={submit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><label className={LABEL}>Liability type<select className={FIELD} value={type} onChange={(event) => setType(event.target.value as typeof type)}><option value="INCOME_TAX_PREPAYMENT">Income tax pre-payment</option><option value="PRIOR_YEAR_SETTLEMENT">Prior-year settlement</option><option value="OTHER">Interest, surcharge or other</option></select></label><label className={LABEL}>Source<select className={FIELD} value={source} onChange={(event) => setSource(event.target.value as typeof source)}><option value="TAX_NOTICE">Tax notice</option><option value="ADVISER">Tax adviser</option><option value="ESTIMATE">My estimate</option></select></label></div><label className={LABEL}>Description<input className={FIELD} name="label" maxLength={160} placeholder="e.g. ESt pre-payment September 2026" required /></label><div className="grid gap-4 sm:grid-cols-2"><label className={LABEL}>Amount (€)<input className={FIELD} name="amount" inputMode="decimal" placeholder="0.00" required /></label><label className={LABEL}>Due date<input className={FIELD} name="dueDate" type="date" required /></label><label className={LABEL}>Notice received <span className="font-normal text-slate-400">(optional)</span><input className={FIELD} name="noticeDate" type="date" /></label><label className={LABEL}>Tax year <span className="font-normal text-slate-400">(optional)</span><input className={FIELD} name="taxYear" type="number" min="1990" max="2200" placeholder="2024" /></label></div><label className={LABEL}>Notes <span className="font-normal text-slate-400">(optional)</span><textarea className={cn(FIELD, 'min-h-24 resize-y')} name="notes" maxLength={2000} placeholder="Only what is useful for checking the liability later." /></label>{error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}<div className="flex justify-end"><SubmitButton saving={saving}>Save liability</SubmitButton></div></form></Modal>
}

function SettingsDialog({ profile, onClose, onSaved }: { profile: TaxDashboardData['profile']; onClose: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError('')
    const form = new FormData(event.currentTarget)
    try { await jsonRequest('/api/tax/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bankBalance: form.get('bankBalance'), reportingStartYear: form.get('reportingStartYear'), vatFilingFrequency: form.get('vatFilingFrequency'), hasPermanentExtension: form.get('hasPermanentExtension') === 'on' }) }); await onSaved() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save') } finally { setSaving(false) }
  }
  return <Modal title="Tax Horizon settings" description="These values control planning calculations. No bank connection is made." onClose={onClose}><form onSubmit={submit} className="space-y-5"><label className={LABEL}>Current bank balance (€)<input className={FIELD} name="bankBalance" inputMode="decimal" defaultValue={(profile.bankBalanceCents / 100).toFixed(2)} required /></label><div className="grid gap-4 sm:grid-cols-2"><label className={LABEL}>VAT filing period<select className={FIELD} name="vatFilingFrequency" defaultValue={profile.vatFilingFrequency}><option value="QUARTERLY">Quarterly</option><option value="MONTHLY">Monthly</option><option value="UNKNOWN">Not yet confirmed</option></select></label><label className={LABEL}>Records begin<input className={FIELD} name="reportingStartYear" type="number" min="1990" max={new Date().getFullYear()} defaultValue={profile.reportingStartYear} required /></label></div><label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-fmea-border dark:bg-fmea-bg3"><input className="mt-0.5 h-4 w-4 rounded border-stone-300 text-cyan-700 focus:ring-cyan-600" name="hasPermanentExtension" type="checkbox" defaultChecked={profile.hasPermanentExtension} /><span><span className="block text-sm font-semibold text-slate-800 dark:text-fmea-text">Dauerfristverlängerung applies</span><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-fmea-dim">Moves the calculated VAT planning date by one month. Confirm this with your adviser.</span></span></label><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300"><strong>Important:</strong> the tool moves Saturday and Sunday dates to Monday, but does not yet know state-specific public holidays. The date on a notice or from your Steuerberater remains authoritative.</div>{error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}<div className="flex justify-end"><SubmitButton saving={saving}>Save settings</SubmitButton></div></form></Modal>
}
