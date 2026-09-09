'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, CheckCircle2, ExternalLink, FileUp, Loader2, Plus, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react'

interface WorkRow {
  workDate: string
  hours: string
  activity: string | null
  projectLabel: string | null
  sourcePage: number | null
}

interface Extraction {
  documentNumber: string | null
  documentDate: string | null
  expectedPaymentDate: string | null
  actualPaymentDate: string | null
  description: string | null
  clientName: string | null
  projectLabel: string | null
  netAmount: string | null
  vatAmount: string | null
  grossAmount: string | null
  vatRate: number | null
  currency: string
  billedHours: string | null
  workSessions: WorkRow[]
  warnings: string[]
  sourceFileName: string
  sourceFileHash: string
  extractionModel: string
}

const FIELD = 'mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100 dark:border-fmea-border dark:bg-fmea-bg3 dark:text-fmea-hi dark:focus:border-fmea-accent dark:focus:ring-cyan-950/60'
const LABEL = 'block text-xs font-semibold text-slate-600 dark:text-fmea-dim'

async function readResponse(response: Response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Unable to process the remittance')
  return data
}

export function RemittanceUploadDialog({ onClose, onSaved }: {
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [file, setFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [extraction, setExtraction] = useState<Extraction | null>(null)
  const [workSessions, setWorkSessions] = useState<WorkRow[]>([])

  useEffect(() => {
    if (!file) {
      setPdfUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPdfUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const extractedHours = useMemo(
    () => workSessions.reduce((total, row) => total + (Number(row.hours.replace(',', '.')) || 0), 0),
    [workSessions]
  )
  const billedHours = Number(extraction?.billedHours ?? 0)
  const hoursAgree = !billedHours || Math.abs(extractedHours - billedHours) <= 0.01

  const extract = async () => {
    if (!file) return
    setExtracting(true)
    setError('')
    try {
      const form = new FormData()
      form.set('file', file)
      const result = await readResponse(await fetch('/api/tax/remittance-extract', { method: 'POST', body: form })) as Extraction
      setExtraction(result)
      setWorkSessions(result.workSessions)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to extract the remittance')
    } finally {
      setExtracting(false)
    }
  }

  const updateWorkRow = (index: number, field: keyof WorkRow, value: string) => {
    setWorkSessions((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row))
  }

  const removeWorkRow = (index: number) => {
    setWorkSessions((current) => current.filter((_, rowIndex) => rowIndex !== index))
  }

  const addWorkRow = () => {
    setWorkSessions((current) => [...current, {
      workDate: extraction?.documentDate ?? '',
      hours: '',
      activity: null,
      projectLabel: extraction?.projectLabel ?? null,
      sourcePage: null,
    }])
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!extraction) return
    setSaving(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await readResponse(await fetch('/api/tax/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CLIENT_REMITTANCE',
          documentDate: form.get('documentDate'),
          expectedPaymentDate: form.get('expectedPaymentDate'),
          paymentDate: form.get('paymentDate'),
          reference: form.get('reference'),
          description: form.get('description'),
          projectLabel: form.get('projectLabel'),
          netAmount: form.get('netAmount'),
          vatAmount: form.get('vatAmount'),
          grossAmount: form.get('grossAmount'),
          workSessions: workSessions.map((row) => ({
            ...row,
            projectLabel: String(form.get('projectLabel') || '').trim() || null,
          })),
          aiExtracted: true,
          sourceFileName: extraction.sourceFileName,
          sourceFileHash: extraction.sourceFileHash,
          extractionModel: extraction.extractionModel,
        }),
      }))
      await onSaved()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save the remittance')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation">
      <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-white/60 bg-[#fdfdfc] shadow-2xl dark:border-fmea-border dark:bg-fmea-bg2 sm:max-w-6xl sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="remittance-upload-title">
        <div className="sticky top-0 z-20 flex items-start justify-between border-b border-stone-200 bg-[#fdfdfc]/95 px-5 py-5 backdrop-blur dark:border-fmea-border dark:bg-fmea-bg2/95 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-fmea-accent">AI-assisted entry</p>
            <h2 id="remittance-upload-title" className="mt-1 text-xl font-semibold text-slate-950 dark:text-fmea-hi">Upload client remittance</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-fmea-dim">Claude proposes the figures and work dates. Nothing is saved until you confirm it.</p>
          </div>
          <button type="button" onClick={onClose} className="ml-4 rounded-xl p-2 text-slate-400 hover:bg-stone-100 hover:text-slate-700 dark:hover:bg-fmea-bg3 dark:hover:text-fmea-text" aria-label="Close dialog"><X className="h-5 w-5" /></button>
        </div>

        {!extraction ? (
          <div className="mx-auto max-w-2xl p-5 sm:p-8">
            <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 text-center transition hover:border-cyan-500 hover:bg-cyan-50/40 dark:border-fmea-border dark:bg-fmea-bg3/40 dark:hover:border-fmea-accent">
              <FileUp className="h-9 w-9 text-cyan-700 dark:text-fmea-accent" />
              <span className="mt-4 text-sm font-semibold text-slate-800 dark:text-fmea-text">Choose a remittance PDF</span>
              <span className="mt-1 text-xs text-slate-400 dark:text-fmea-dim">Standard, unencrypted PDF · maximum 4 MB</span>
              <input
                className="sr-only"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null)
                  setExtraction(null)
                  setError('')
                }}
              />
            </label>
            {file && <p className="mt-3 truncate text-center text-xs font-semibold text-slate-600 dark:text-fmea-text">{file.name} · {(file.size / 1024).toFixed(0)} KB</p>}

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>The PDF will be sent to Anthropic for this extraction. It is not stored by Reference or placed in Anthropic’s Files API. Standard Anthropic API retention terms still apply.</p>
            </div>
            {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => void extract()} disabled={!file || extracting} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-fmea-accent dark:text-fmea-bg">
                {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {extracting ? 'Reading the PDF…' : 'Extract with Claude'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={save} className="grid lg:grid-cols-[minmax(20rem,0.8fr)_minmax(32rem,1.2fr)]">
            <div className="border-b border-stone-200 bg-stone-100/70 p-5 dark:border-fmea-border dark:bg-fmea-bg3/40 lg:border-b-0 lg:border-r">
              <div className="sticky top-28">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="truncate text-xs font-semibold text-slate-600 dark:text-fmea-text">{extraction.sourceFileName}</p>
                  {pdfUrl && <a href={pdfUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-cyan-800 dark:text-fmea-accent"><ExternalLink className="h-3.5 w-3.5" />Open PDF</a>}
                </div>
                {pdfUrl && <iframe src={pdfUrl} className="hidden h-[66vh] w-full rounded-xl border border-stone-300 bg-white lg:block" title="Source remittance PDF" />}
                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-fmea-dim">Compare every proposed value with the source. The PDF remains only in this browser window and is discarded when the dialog closes.</p>
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              {(extraction.warnings.length > 0 || extraction.currency !== 'EUR') && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
                  <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">Check before saving</p><ul className="mt-1 list-disc space-y-1 pl-4">{extraction.currency !== 'EUR' && <li>This first version records EUR remittances only; the document reports {extraction.currency}.</li>}{extraction.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div></div>
                </div>
              )}

              <section>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-700 dark:text-fmea-accent" /><h3 className="text-sm font-semibold text-slate-900 dark:text-fmea-hi">Remittance</h3></div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className={LABEL}>Document / invoice number<input className={FIELD} name="reference" defaultValue={extraction.documentNumber ?? ''} maxLength={120} placeholder="Enter exactly as printed" required /></label>
                  <label className={LABEL}>Document date<input className={FIELD} name="documentDate" type="date" defaultValue={extraction.documentDate ?? ''} required /></label>
                  <label className={LABEL}>Expected payment <span className="font-normal text-slate-400">(not received)</span><input className={FIELD} name="expectedPaymentDate" type="date" defaultValue={extraction.expectedPaymentDate ?? ''} /></label>
                  <label className={LABEL}>Actual bank payment <span className="font-normal text-slate-400">(optional)</span><input className={FIELD} name="paymentDate" type="date" defaultValue={extraction.actualPaymentDate ?? ''} /></label>
                  <label className={LABEL}>Project<input className={FIELD} name="projectLabel" defaultValue={extraction.projectLabel ?? ''} maxLength={160} /></label>
                  <label className={LABEL}>Description<input className={FIELD} name="description" defaultValue={extraction.description ?? ''} maxLength={500} /></label>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-fmea-dim">The expected date is for planning only. VAT enters the reserve only when an actual bank payment date is recorded.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <label className={LABEL}>Net amount (€)<input className={FIELD} name="netAmount" defaultValue={extraction.netAmount ?? ''} inputMode="decimal" required /></label>
                  <label className={LABEL}>VAT amount (€)<input className={FIELD} name="vatAmount" defaultValue={extraction.vatAmount ?? ''} inputMode="decimal" required /></label>
                  <label className={LABEL}>Gross amount (€)<input className={FIELD} name="grossAmount" defaultValue={extraction.grossAmount ?? ''} inputMode="decimal" required /></label>
                </div>
              </section>

              <section className="border-t border-stone-200 pt-6 dark:border-fmea-border">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div><h3 className="text-sm font-semibold text-slate-900 dark:text-fmea-hi">Work dates</h3><p className="mt-1 text-xs text-slate-400 dark:text-fmea-dim">Review each date and its hours before saving.</p></div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${hoursAgree ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300'}`}>
                    {extractedHours.toFixed(2)} extracted{billedHours ? ` / ${billedHours.toFixed(2)} billed` : ''}
                  </div>
                </div>
                <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                  {workSessions.map((row, index) => (
                    <div key={`${row.workDate}-${index}`} className="grid gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-fmea-border dark:bg-fmea-bg3 sm:grid-cols-[9rem_6rem_minmax(0,1fr)_2rem]">
                      <label className="text-[10px] font-semibold text-slate-400">Date<input className={FIELD} type="date" value={row.workDate} onChange={(event) => updateWorkRow(index, 'workDate', event.target.value)} required /></label>
                      <label className="text-[10px] font-semibold text-slate-400">Hours<input className={FIELD} inputMode="decimal" value={row.hours} onChange={(event) => updateWorkRow(index, 'hours', event.target.value)} required /></label>
                      <label className="text-[10px] font-semibold text-slate-400">Activity<input className={FIELD} value={row.activity ?? ''} onChange={(event) => updateWorkRow(index, 'activity', event.target.value)} maxLength={240} /></label>
                      <button type="button" onClick={() => removeWorkRow(index)} className="mt-5 flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove work row ${index + 1}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  {!workSessions.length && <p className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-xs text-slate-400 dark:border-fmea-border">No daily work records were found. Add them manually if the PDF contains them.</p>}
                </div>
                <button type="button" onClick={addWorkRow} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-800 dark:text-fmea-accent"><Plus className="h-3.5 w-3.5" />Add work date</button>
              </section>

              {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
              <div className="flex flex-col-reverse gap-2 border-t border-stone-200 pt-5 dark:border-fmea-border sm:flex-row sm:justify-between">
                <button type="button" onClick={() => { setExtraction(null); setWorkSessions([]); setError('') }} className="min-h-11 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:border-fmea-border dark:text-fmea-text">Choose another PDF</button>
                <button type="submit" disabled={saving || extraction.currency !== 'EUR'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-fmea-accent dark:text-fmea-bg">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? 'Saving…' : 'Confirm and save'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
