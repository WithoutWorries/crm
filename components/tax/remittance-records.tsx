'use client'

import Link from 'next/link'
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, FileCheck2, Loader2, Pencil, Plus, ReceiptText, Search, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkSessionRow {
  id?: string
  workDate: string
  hours: string
  activity: string | null
  projectLabel: string | null
  sourcePage: number | null
}

interface RemittanceRecord {
  id: string
  reference: string | null
  description: string | null
  documentDate: string | null
  expectedPaymentDate: string | null
  paymentDate: string | null
  netCents: number
  vatCents: number
  grossCents: number
  aiExtracted: boolean
  sourceFileName: string | null
  createdAt: string
  updatedAt: string
  workSessions: WorkSessionRow[]
}

type Filter = 'all' | 'pending' | 'paid' | 'missing'

const FIELD = 'mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100 dark:border-fmea-border dark:bg-fmea-bg3 dark:text-fmea-hi dark:focus:border-fmea-accent dark:focus:ring-cyan-950/60'
const LABEL = 'block text-xs font-semibold text-slate-600 dark:text-fmea-dim'

function money(cents: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function dateLabel(value: string | null) {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00.000Z`))
}

function decimal(cents: number) {
  return (cents / 100).toFixed(2)
}

async function jsonRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Unable to complete the request')
  return data
}

export function RemittanceRecords() {
  const [records, setRecords] = useState<RemittanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState<RemittanceRecord | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const load = async () => {
    try {
      setError('')
      const result = await jsonRequest('/api/tax/remittances', { cache: 'no-store' }) as { records: RemittanceRecord[] }
      setRecords(result.records)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load remittances')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return records.filter((record) => {
      if (filter === 'pending' && record.paymentDate) return false
      if (filter === 'paid' && !record.paymentDate) return false
      if (filter === 'missing' && record.reference) return false
      if (!needle) return true
      return [
        record.reference,
        record.description,
        record.sourceFileName,
        ...record.workSessions.flatMap((session) => [session.projectLabel, session.activity]),
      ].some((value) => value?.toLocaleLowerCase().includes(needle))
    })
  }, [filter, query, records])

  const pendingCount = records.filter((record) => !record.paymentDate).length
  const missingCount = records.filter((record) => !record.reference).length

  const remove = async (record: RemittanceRecord) => {
    if (!window.confirm(`Delete remittance ${record.reference || dateLabel(record.documentDate)} and its work records?`)) return
    setRemovingId(record.id)
    try {
      await jsonRequest(`/api/tax/entries/${record.id}`, { method: 'DELETE' })
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete the remittance')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1450px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/tax" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-800 hover:text-cyan-950 dark:text-fmea-accent"><ArrowLeft className="h-3.5 w-3.5" />Tax Horizon</Link>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-fmea-accent"><ReceiptText className="h-4 w-4" />Accounting records</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-fmea-hi sm:text-4xl">Remittance records</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-fmea-dim">Every client remittance in one place, identified by the number printed on the notice.</p>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Summary label="Total remittances" value={String(records.length)} tone="cyan" />
        <Summary label="Awaiting bank payment" value={String(pendingCount)} tone="amber" />
        <Summary label="Missing document number" value={String(missingCount)} tone={missingCount ? 'rose' : 'slate'} />
      </section>

      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-fmea-border dark:bg-fmea-bg2">
        <div className="flex flex-col gap-3 border-b border-stone-100 p-5 dark:border-fmea-border sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <label className="relative block w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 dark:border-fmea-border dark:bg-fmea-bg3 dark:text-fmea-hi" placeholder="Search document number, project or description" />
          </label>
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Remittance status">
            {([['all', 'All'], ['pending', 'Awaiting payment'], ['paid', 'Paid'], ['missing', 'Missing number']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={cn('whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition', filter === value ? 'bg-cyan-800 text-white dark:bg-fmea-accent dark:text-fmea-bg' : 'text-slate-500 hover:bg-stone-100 dark:text-fmea-dim dark:hover:bg-fmea-bg3')}>{label}</button>)}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center text-sm text-slate-500 dark:text-fmea-dim"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading remittances…</div>
        ) : error && !records.length ? (
          <div className="px-6 py-16 text-center text-sm text-rose-700">{error}</div>
        ) : visible.length ? (
          <div className="divide-y divide-stone-100 dark:divide-fmea-border">
            {visible.map((record) => {
              const hours = record.workSessions.reduce((sum, session) => sum + Number(session.hours), 0)
              const project = record.workSessions.find((session) => session.projectLabel)?.projectLabel
              return (
                <article key={record.id} className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(15rem,1.3fr)_minmax(13rem,0.8fr)_minmax(12rem,0.7fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {record.reference ? <h2 className="text-base font-semibold text-slate-950 dark:text-fmea-hi">Document {record.reference}</h2> : <button type="button" onClick={() => setEditing(record)} className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white">Missing number · add now</button>}
                      {record.aiExtracted && <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[9px] font-semibold text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/30 dark:text-violet-300">AI reviewed</span>}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600 dark:text-fmea-text">{record.description || project || 'No description recorded'}</p>
                    {record.sourceFileName && <p className="mt-1 truncate text-[10px] text-slate-400 dark:text-fmea-dim">Source: {record.sourceFileName}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs lg:grid-cols-1">
                    <RecordDate label="Remittance" value={record.documentDate} />
                    <RecordDate label={record.paymentDate ? 'Paid' : 'Expected'} value={record.paymentDate || record.expectedPaymentDate} important={!record.paymentDate} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tracking-tight tabular-nums text-slate-950 dark:text-fmea-hi">{money(record.grossCents)}</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-fmea-dim">VAT {money(record.vatCents)}{hours ? ` · ${hours.toFixed(2)} hours` : ''}</p>
                    <span className={cn('mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-semibold', record.paymentDate ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300')}>{record.paymentDate ? 'Payment recorded' : 'Awaiting payment'}</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={() => setEditing(record)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-2 text-xs font-semibold text-cyan-900 hover:bg-cyan-100 dark:border-cyan-900/70 dark:bg-cyan-950/30 dark:text-cyan-200"><Pencil className="h-3.5 w-3.5" />Edit</button>
                    <button type="button" onClick={() => void remove(record)} disabled={removingId === record.id} className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:text-fmea-border dark:hover:bg-rose-950/30 dark:hover:text-rose-300" aria-label={`Delete remittance ${record.reference || ''}`}>{removingId === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="px-6 py-16 text-center"><FileCheck2 className="mx-auto h-8 w-8 text-stone-300 dark:text-fmea-border" /><p className="mt-3 text-sm font-semibold text-slate-700 dark:text-fmea-text">No matching remittances</p><p className="mt-1 text-xs text-slate-400 dark:text-fmea-dim">Try another document number or filter.</p></div>
        )}
      </section>

      {error && records.length > 0 && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {editing && <EditRemittanceDialog record={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load() }} />}
    </div>
  )
}

function Summary({ label, value, tone }: { label: string; value: string; tone: 'cyan' | 'amber' | 'rose' | 'slate' }) {
  const style = { cyan: 'bg-cyan-700 text-white', amber: 'bg-amber-500 text-slate-950', rose: 'bg-rose-600 text-white', slate: 'bg-slate-600 text-white' }[tone]
  return <div className={cn('rounded-2xl px-5 py-4 shadow-sm', style)}><p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p><p className="mt-1 text-xs font-semibold opacity-80">{label}</p></div>
}

function RecordDate({ label, value, important = false }: { label: string; value: string | null; important?: boolean }) {
  return <div><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-fmea-dim">{label}</p><p className={cn('mt-0.5 font-semibold', important ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-fmea-text')}>{dateLabel(value)}</p></div>
}

function Modal({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-white/60 bg-[#fdfdfc] shadow-2xl dark:border-fmea-border dark:bg-fmea-bg2 sm:max-w-3xl sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="edit-remittance-title"><div className="sticky top-0 z-20 flex items-start justify-between border-b border-stone-200 bg-[#fdfdfc]/95 px-5 py-5 backdrop-blur dark:border-fmea-border dark:bg-fmea-bg2/95 sm:px-6"><div><h2 id="edit-remittance-title" className="text-xl font-semibold text-slate-950 dark:text-fmea-hi">{title}</h2><p className="mt-1 text-sm text-slate-500 dark:text-fmea-dim">{description}</p></div><button type="button" onClick={onClose} className="ml-4 rounded-xl p-2 text-slate-400 hover:bg-stone-100 dark:hover:bg-fmea-bg3" aria-label="Close dialog"><X className="h-5 w-5" /></button></div>{children}</div></div>
}

function EditRemittanceDialog({ record, onClose, onSaved }: { record: RemittanceRecord; onClose: () => void; onSaved: () => Promise<void> }) {
  const [workSessions, setWorkSessions] = useState<WorkSessionRow[]>(record.workSessions)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const project = record.workSessions.find((session) => session.projectLabel)?.projectLabel ?? ''

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError('')
    const form = new FormData(event.currentTarget)
    try {
      await jsonRequest(`/api/tax/entries/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateRemittance',
          reference: form.get('reference'),
          description: form.get('description'),
          documentDate: form.get('documentDate'),
          expectedPaymentDate: form.get('expectedPaymentDate'),
          paymentDate: form.get('paymentDate'),
          projectLabel: form.get('projectLabel'),
          netAmount: form.get('netAmount'),
          vatAmount: form.get('vatAmount'),
          grossAmount: form.get('grossAmount'),
          workSessions: workSessions.map((session) => ({ ...session, projectLabel: String(form.get('projectLabel') || '').trim() || null })),
        }),
      })
      await onSaved()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update the remittance')
    } finally {
      setSaving(false)
    }
  }

  return <Modal title="Edit remittance" description="Correct the stored record. The VAT reserve and work calendar will be recalculated." onClose={onClose}><form onSubmit={submit} className="space-y-6 p-5 sm:p-6"><section><div className="grid gap-4 sm:grid-cols-2"><label className={LABEL}>Document / invoice number<input className={FIELD} name="reference" defaultValue={record.reference ?? ''} maxLength={120} autoFocus required /></label><label className={LABEL}>Remittance date<input className={FIELD} name="documentDate" type="date" defaultValue={record.documentDate ?? ''} required /></label><label className={LABEL}>Expected payment <span className="font-normal text-slate-400">(optional)</span><input className={FIELD} name="expectedPaymentDate" type="date" defaultValue={record.expectedPaymentDate ?? ''} /></label><label className={LABEL}>Actual bank payment <span className="font-normal text-slate-400">(optional)</span><input className={FIELD} name="paymentDate" type="date" defaultValue={record.paymentDate ?? ''} /></label><label className={LABEL}>Project <span className="font-normal text-slate-400">(optional)</span><input className={FIELD} name="projectLabel" defaultValue={project} maxLength={160} /></label><label className={LABEL}>Description <span className="font-normal text-slate-400">(optional)</span><input className={FIELD} name="description" defaultValue={record.description ?? ''} maxLength={500} /></label></div><div className="mt-4 grid gap-4 sm:grid-cols-3"><label className={LABEL}>Net amount (€)<input className={FIELD} name="netAmount" defaultValue={decimal(record.netCents)} inputMode="decimal" required /></label><label className={LABEL}>VAT amount (€)<input className={FIELD} name="vatAmount" defaultValue={decimal(record.vatCents)} inputMode="decimal" required /></label><label className={LABEL}>Gross amount (€)<input className={FIELD} name="grossAmount" defaultValue={decimal(record.grossCents)} inputMode="decimal" required /></label></div>{record.sourceFileName && <p className="mt-3 text-[10px] text-slate-400 dark:text-fmea-dim">Originally extracted from {record.sourceFileName}. The PDF itself was not retained.</p>}</section><section className="border-t border-stone-200 pt-5 dark:border-fmea-border"><div className="flex items-end justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-900 dark:text-fmea-hi">Work dates</h3><p className="mt-1 text-xs text-slate-400 dark:text-fmea-dim">Changes also update the annual work map.</p></div><button type="button" onClick={() => setWorkSessions((current) => [...current, { workDate: record.documentDate ?? '', hours: '', activity: null, projectLabel: project || null, sourcePage: null }])} className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-800 dark:text-fmea-accent"><Plus className="h-3.5 w-3.5" />Add date</button></div><div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">{workSessions.map((session, index) => <div key={session.id ?? index} className="grid gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-fmea-border dark:bg-fmea-bg3 sm:grid-cols-[9rem_6rem_minmax(0,1fr)_2rem]"><label className="text-[10px] font-semibold text-slate-400">Date<input className={FIELD} type="date" value={session.workDate} onChange={(event) => setWorkSessions((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, workDate: event.target.value } : row))} required /></label><label className="text-[10px] font-semibold text-slate-400">Hours<input className={FIELD} value={session.hours} onChange={(event) => setWorkSessions((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, hours: event.target.value } : row))} inputMode="decimal" required /></label><label className="text-[10px] font-semibold text-slate-400">Activity<input className={FIELD} value={session.activity ?? ''} onChange={(event) => setWorkSessions((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, activity: event.target.value } : row))} maxLength={240} /></label><button type="button" onClick={() => setWorkSessions((current) => current.filter((_, rowIndex) => rowIndex !== index))} className="mt-5 flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove work row ${index + 1}`}><Trash2 className="h-4 w-4" /></button></div>)}{!workSessions.length && <p className="rounded-xl border border-dashed border-stone-300 px-4 py-7 text-center text-xs text-slate-400 dark:border-fmea-border">No work dates recorded.</p>}</div></section>{error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}<div className="flex justify-end"><button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-900 disabled:opacity-60 dark:bg-fmea-accent dark:text-fmea-bg">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? 'Saving…' : 'Save changes'}</button></div></form></Modal>
}
