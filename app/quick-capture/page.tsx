'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Zap, ArrowLeft, ArrowRight, Check, Loader2, AlertCircle,
  Calculator, Briefcase, Users,
} from 'lucide-react'
import { PROCUREMENT_CATEGORY_LABELS, QUOTE_STATUS_LABELS, FEE_TYPE_LABELS } from '@/lib/constants'

// ─── Types ──────────────────────────────────────────────────────────────────

type AppMode = 'crm' | 'procurement'
type Step = 'input' | 'review' | 'done'

interface CrmExtracted {
  contact: {
    firstName: string | null; lastName: string | null; fullName: string | null
    company: string | null; email: string | null; phone: string | null
    linkedinUrl: string | null; jobTitle: string | null
  }
  enquiry: {
    source: string; subject: string; summary: string; originalExcerpt: string | null
    opportunityTitle: string | null; estimatedValue: number | null; currency: string
    nextAction: string | null; urgency: string
  }
}

interface ProcurementExtracted {
  supplier: {
    name: string | null; contactName: string | null
    email: string | null; website: string | null; location: string | null
  }
  quote: {
    feeAmount: number | null; feeCurrency: string; feeType: string
    servicesOffered: string | null; availability: string | null
    experienceNotes: string | null; prosNotes: string | null; consNotes: string | null
  }
}

interface Project { id: string; title: string; category: string; status: string }

// ─── Constants ───────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  EMAIL: 'Email', CALL: 'Phone call', LINKEDIN_MESSAGE: 'LinkedIn', OTHER: 'Other',
}

const QUOTE_STATUS_OPTIONS = ['RECEIVED', 'SHORTLISTED', 'AWAITED']
const FEE_TYPES = ['TBC', 'FIXED', 'HOURLY', 'DAILY']

const CRM_PLACEHOLDER = `Paste an email, LinkedIn message, or type call notes here.

Examples:
• "Just had a call with Maria Schmidt at BASF. She's looking for FMEA support on a new reactor project starting Q3. Budget around €80k. Her email is m.schmidt@basf.com."
• Paste a full email directly
• Paste a LinkedIn connection message`

const PROCUREMENT_PLACEHOLDER = `Paste the supplier's quote or proposal email here.

Claude will extract the firm name, fee, services offered, availability, experience, and any notable pros or cons — ready for you to review before saving.`

// ─── Component ───────────────────────────────────────────────────────────────

export default function QuickCapturePage() {
  const router = useRouter()

  // Shared state
  const [mode, setMode]       = useState<AppMode>('crm')
  const [step, setStep]       = useState<Step>('input')
  const [rawText, setRawText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [saving, setSaving]   = useState(false)
  const [saveError, setSaveError] = useState('')

  // ── CRM mode state ──
  const [crmExtracted, setCrmExtracted] = useState<CrmExtracted | null>(null)
  const [contact, setContact] = useState<CrmExtracted['contact']>({
    firstName: null, lastName: null, fullName: null, company: null,
    email: null, phone: null, linkedinUrl: null, jobTitle: null,
  })
  const [enquiry, setEnquiry] = useState<CrmExtracted['enquiry']>({
    source: 'OTHER', subject: '', summary: '', originalExcerpt: null,
    opportunityTitle: null, estimatedValue: null, currency: 'EUR',
    nextAction: null, urgency: 'MEDIUM',
  })
  const [createOpportunity, setCreateOpportunity] = useState(true)
  const [createdIds, setCreatedIds] = useState<{ contactId?: string; opportunityId?: string }>({})
  const [calcOpen, setCalcOpen] = useState(false)
  const [calc, setCalc] = useState({
    rate: '', hoursPerWeek: '', durationWeeks: '', durationMonths: '',
    mode: 'months' as 'weeks' | 'months',
  })
  const calcTotal = (() => {
    const rate = parseFloat(calc.rate)
    const hpw  = parseFloat(calc.hoursPerWeek)
    if (!rate || !hpw) return null
    if (calc.mode === 'months') {
      const months = parseFloat(calc.durationMonths)
      if (!months) return null
      return Math.round(rate * hpw * (months * 52 / 12))
    }
    const weeks = parseFloat(calc.durationWeeks)
    if (!weeks) return null
    return Math.round(rate * hpw * weeks)
  })()

  // ── Procurement mode state ──
  const [procExtracted, setProcExtracted] = useState<ProcurementExtracted | null>(null)
  const [supplierName, setSupplierName]   = useState('')
  const [quoteStatus, setQuoteStatus]     = useState('RECEIVED')
  const [feeAmount, setFeeAmount]         = useState('')
  const [feeCurrency, setFeeCurrency]     = useState('EUR')
  const [feeType, setFeeType]             = useState('TBC')
  const [servicesOffered, setServicesOffered] = useState('')
  const [availability, setAvailability]   = useState('')
  const [experienceNotes, setExperienceNotes] = useState('')
  const [prosNotes, setProsNotes]         = useState('')
  const [consNotes, setConsNotes]         = useState('')
  const [projects, setProjects]           = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [savedQuoteId, setSavedQuoteId]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/procurement/projects')
      .then(r => r.ok ? r.json() : [])
      .then((data: Project[]) => {
        const open = data.filter(p => p.status === 'OPEN')
        setProjects(open)
        if (open.length > 0) setSelectedProjectId(open[0].id)
      })
      .catch(() => {})
  }, [])

  const resetState = () => {
    setStep('input'); setRawText(''); setExtractError(''); setSaveError('')
    setCrmExtracted(null); setProcExtracted(null)
    setSupplierName(''); setFeeAmount(''); setFeeType('TBC'); setServicesOffered('')
    setAvailability(''); setExperienceNotes(''); setProsNotes(''); setConsNotes('')
    setSavedQuoteId(null)
  }

  const handleModeChange = (m: AppMode) => { setMode(m); resetState() }

  // ── Extract ──
  const handleExtract = async () => {
    if (!rawText.trim()) return
    setExtracting(true); setExtractError('')
    try {
      const res = await fetch('/api/quick-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, mode }),
      })
      const data = await res.json()
      if (!res.ok) { setExtractError(data.error || 'Extraction failed'); return }

      if (mode === 'crm') {
        setCrmExtracted(data)
        setContact(data.contact)
        setEnquiry(data.enquiry)
        setCreateOpportunity(!!data.enquiry.opportunityTitle)
      } else {
        setProcExtracted(data)
        setSupplierName(data.supplier?.name ?? '')
        setFeeAmount(data.quote?.feeAmount != null ? String(data.quote.feeAmount) : '')
        setFeeCurrency(data.quote?.feeCurrency ?? 'EUR')
        setFeeType(data.quote?.feeType ?? 'TBC')
        setServicesOffered(data.quote?.servicesOffered ?? '')
        setAvailability(data.quote?.availability ?? '')
        setExperienceNotes(data.quote?.experienceNotes ?? '')
        setProsNotes(data.quote?.prosNotes ?? '')
        setConsNotes(data.quote?.consNotes ?? '')
      }
      setStep('review')
    } catch {
      setExtractError('Something went wrong. Please try again.')
    } finally {
      setExtracting(false)
    }
  }

  // ── CRM save ──
  const handleCrmSave = async () => {
    setSaving(true); setSaveError('')
    try {
      const fullName = contact.fullName ||
        [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
        contact.company || 'Unknown'

      const contactRes = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: contact.firstName || fullName, lastName: contact.lastName || '',
          fullName, email: contact.email || null, phone: contact.phone || null,
          linkedinUrl: contact.linkedinUrl || null, jobTitle: contact.jobTitle || null,
          companyName: contact.company || null,
          influenceLevel: 'UNKNOWN', relationshipType: 'NEW',
        }),
      })
      const newContact = contactRes.ok ? await contactRes.json() : null
      const contactId  = newContact?.id

      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: enquiry.source === 'EMAIL' ? 'EMAIL'
            : enquiry.source === 'CALL' ? 'CALL'
            : enquiry.source === 'LINKEDIN_MESSAGE' ? 'LINKEDIN_MESSAGE' : 'NOTE',
          subject: enquiry.subject, summary: enquiry.summary,
          nextStep: enquiry.nextAction || null,
          happenedAt: new Date(), contactId: contactId || null,
        }),
      })

      let opportunityId: string | undefined
      if (createOpportunity && enquiry.opportunityTitle) {
        const oppRes = await fetch('/api/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: enquiry.opportunityTitle, description: enquiry.summary,
            stage: 'NEW_LEAD', companyId: null, primaryContactId: contactId || null,
            estimatedValue: enquiry.estimatedValue || null, currency: enquiry.currency || 'EUR',
            urgency: enquiry.urgency || 'MEDIUM', nextAction: enquiry.nextAction || null,
            projectPhase: 'UNKNOWN',
          }),
        })
        if (oppRes.ok) { const opp = await oppRes.json(); opportunityId = opp.id }
      }

      setCreatedIds({ contactId, opportunityId })
      setStep('done')
    } catch {
      setSaveError('Failed to save. Please check the details and try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Procurement save ──
  const handleProcSave = async () => {
    if (!selectedProjectId) { setSaveError('Please select a project'); return }
    if (!supplierName.trim()) { setSaveError('Supplier name is required'); return }
    setSaving(true); setSaveError('')
    try {
      const res = await fetch('/api/procurement/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId:    selectedProjectId,
          supplierName: supplierName.trim(),
          status:       quoteStatus,
          feeAmount:    feeAmount ? Number(feeAmount) : null,
          feeCurrency,
          feeType,
          servicesOffered: servicesOffered || null,
          availability:    availability    || null,
          experienceNotes: experienceNotes || null,
          prosNotes:       prosNotes       || null,
          consNotes:       consNotes       || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setSaveError(d.error || 'Failed to save quote')
        return
      }
      const saved = await res.json()
      setSavedQuoteId(saved.projectId)
      setStep('done')
    } catch {
      setSaveError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Styles ───────────────────────────────────────────────────────────────

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-fmea-accent text-sm'
  const labelCls = 'block text-xs font-medium text-slate-500 dark:text-fmea-dim mb-1 uppercase tracking-wide'
  const amberInputCls = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm'
  const amberLabelCls = 'block text-xs font-medium text-slate-500 dark:text-fmea-dim mb-1 uppercase tracking-wide'

  const accentColor  = mode === 'procurement' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/25' : 'bg-fmea-accent text-fmea-bg hover:opacity-90'
  const ringColor    = mode === 'procurement' ? 'focus:ring-amber-400' : 'focus:ring-fmea-accent'
  const stepActive   = mode === 'procurement' ? 'bg-amber-500 text-white' : 'bg-fmea-accent text-fmea-bg'
  const stepDone     = 'bg-emerald-500 text-white'

  return (
    <div className="max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-2 rounded-xl ${mode === 'procurement' ? 'bg-amber-500 shadow-md shadow-amber-500/30' : 'bg-fmea-accent'} text-white dark:text-fmea-bg`}>
          {mode === 'procurement' ? <Briefcase className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">Quick Capture</h1>
          <p className="text-sm text-slate-500 dark:text-fmea-dim">Paste text — AI extracts the details</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleModeChange('crm')}
          className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all text-left ${
            mode === 'crm'
              ? 'border-fmea-accent bg-fmea-accent/10 dark:bg-fmea-accent/5'
              : 'border-slate-200 dark:border-fmea-border hover:border-slate-300 dark:hover:border-fmea-border2'
          }`}
        >
          <Users className={`h-5 w-5 shrink-0 ${mode === 'crm' ? 'text-fmea-accent' : 'text-slate-400 dark:text-fmea-dim'}`} />
          <div>
            <p className={`text-sm font-bold ${mode === 'crm' ? 'text-fmea-accent' : 'text-slate-700 dark:text-fmea-text'}`}>Client Enquiry</p>
            <p className="text-xs text-slate-500 dark:text-fmea-dim">Email, call, or LinkedIn → contact + activity</p>
          </div>
        </button>
        <button
          onClick={() => handleModeChange('procurement')}
          className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all text-left ${
            mode === 'procurement'
              ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/5'
              : 'border-slate-200 dark:border-fmea-border hover:border-slate-300 dark:hover:border-fmea-border2'
          }`}
        >
          <Briefcase className={`h-5 w-5 shrink-0 ${mode === 'procurement' ? 'text-amber-500' : 'text-slate-400 dark:text-fmea-dim'}`} />
          <div>
            <p className={`text-sm font-bold ${mode === 'procurement' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-fmea-text'}`}>Quote Response</p>
            <p className="text-xs text-slate-500 dark:text-fmea-dim">Supplier reply → procurement project quote</p>
          </div>
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(['input', 'review', 'done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step === s ? stepActive
              : i < ['input','review','done'].indexOf(step) ? stepDone
              : 'bg-slate-200 dark:bg-fmea-bg3 text-slate-400 dark:text-fmea-dim'
            }`}>
              {i < ['input','review','done'].indexOf(step) ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step === s ? (mode === 'procurement' ? 'text-amber-500' : 'text-fmea-accent') : 'text-slate-400 dark:text-fmea-dim'}`}>
              {s === 'input' ? 'Paste' : s === 'review' ? 'Review' : 'Done'}
            </span>
            {i < 2 && <div className="w-8 h-px bg-slate-200 dark:bg-fmea-border mx-1" />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Input ── */}
      {step === 'input' && (
        <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-6">
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder={mode === 'procurement' ? PROCUREMENT_PLACEHOLDER : CRM_PLACEHOLDER}
            rows={12}
            className={`w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-fmea-border bg-slate-50 dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 ${ringColor} text-sm resize-none`}
          />
          {extractError && (
            <div className="mt-3 flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {extractError}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleExtract}
              disabled={!rawText.trim() || extracting}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 ${accentColor}`}
            >
              {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {extracting ? 'Extracting…' : 'Extract details'}
              {!extracting && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Review (CRM) ── */}
      {step === 'review' && mode === 'crm' && crmExtracted && (
        <div className="space-y-5">
          {/* Contact */}
          <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-fmea-hi mb-4">Contact Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>First name</label><input value={contact.firstName ?? ''} onChange={e => setContact({ ...contact, firstName: e.target.value || null })} className={inputCls} /></div>
              <div><label className={labelCls}>Last name</label><input value={contact.lastName ?? ''} onChange={e => setContact({ ...contact, lastName: e.target.value || null })} className={inputCls} /></div>
              <div><label className={labelCls}>Company</label><input value={contact.company ?? ''} onChange={e => setContact({ ...contact, company: e.target.value || null })} className={inputCls} /></div>
              <div><label className={labelCls}>Job title</label><input value={contact.jobTitle ?? ''} onChange={e => setContact({ ...contact, jobTitle: e.target.value || null })} className={inputCls} /></div>
              <div><label className={labelCls}>Email</label><input type="email" value={contact.email ?? ''} onChange={e => setContact({ ...contact, email: e.target.value || null })} className={inputCls} /></div>
              <div><label className={labelCls}>Phone</label><input value={contact.phone ?? ''} onChange={e => setContact({ ...contact, phone: e.target.value || null })} className={inputCls} /></div>
              <div className="col-span-2"><label className={labelCls}>LinkedIn URL</label><input value={contact.linkedinUrl ?? ''} onChange={e => setContact({ ...contact, linkedinUrl: e.target.value || null })} className={inputCls} /></div>
            </div>
          </div>

          {/* Enquiry */}
          <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-fmea-hi mb-4">Enquiry Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Source</label>
                  <select value={enquiry.source} onChange={e => setEnquiry({ ...enquiry, source: e.target.value })} className={inputCls}>
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Urgency</label>
                  <select value={enquiry.urgency} onChange={e => setEnquiry({ ...enquiry, urgency: e.target.value })} className={inputCls}>
                    <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div><label className={labelCls}>Activity subject</label><input value={enquiry.subject} onChange={e => setEnquiry({ ...enquiry, subject: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Summary</label><textarea value={enquiry.summary} onChange={e => setEnquiry({ ...enquiry, summary: e.target.value })} rows={3} className={inputCls} /></div>
              {enquiry.originalExcerpt && (
                <div><label className={labelCls}>Original language excerpt</label>
                  <div className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-fmea-border bg-slate-50 dark:bg-fmea-bg text-slate-500 dark:text-fmea-dim text-sm italic leading-relaxed">{enquiry.originalExcerpt}</div>
                </div>
              )}
              <div><label className={labelCls}>Next action</label><input value={enquiry.nextAction ?? ''} onChange={e => setEnquiry({ ...enquiry, nextAction: e.target.value || null })} className={inputCls} placeholder="e.g. Send capability statement" /></div>
            </div>
          </div>

          {/* Opportunity */}
          <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-6">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input type="checkbox" checked={createOpportunity} onChange={e => setCreateOpportunity(e.target.checked)} className="w-4 h-4 rounded accent-fmea-accent" />
              <span className="text-sm font-semibold text-slate-900 dark:text-fmea-hi">Also create an Opportunity</span>
            </label>
            {createOpportunity && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className={labelCls}>Opportunity title</label><input value={enquiry.opportunityTitle ?? ''} onChange={e => setEnquiry({ ...enquiry, opportunityTitle: e.target.value || null })} className={inputCls} /></div>
                <div>
                  <label className={labelCls}>Estimated value</label>
                  <input type="number" value={enquiry.estimatedValue ?? ''} onChange={e => setEnquiry({ ...enquiry, estimatedValue: e.target.value ? Number(e.target.value) : null })} className={inputCls} placeholder="0" />
                  <button type="button" onClick={() => setCalcOpen(o => !o)} className="mt-1.5 flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:underline">
                    <Calculator className="h-3 w-3" />
                    {calcOpen ? 'Hide calculator' : 'Calculate from rate × hours'}
                  </button>
                  {calcOpen && (
                    <div className="mt-3 p-4 rounded-lg bg-slate-50 dark:bg-fmea-bg border border-slate-200 dark:border-fmea-border space-y-3">
                      <p className="text-xs font-medium text-slate-600 dark:text-fmea-dim">Contract Value Calculator</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="block text-xs text-slate-500 dark:text-fmea-dim mb-1">Hourly rate</label><input type="number" placeholder="e.g. 120" value={calc.rate} onChange={e => setCalc({ ...calc, rate: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-sm dark:text-fmea-text focus:outline-none focus:ring-1 focus:ring-cyan-400" /></div>
                        <div><label className="block text-xs text-slate-500 dark:text-fmea-dim mb-1">Hours / week</label><input type="number" placeholder="e.g. 40" value={calc.hoursPerWeek} onChange={e => setCalc({ ...calc, hoursPerWeek: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-sm dark:text-fmea-text focus:outline-none focus:ring-1 focus:ring-cyan-400" /></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setCalc({ ...calc, mode: 'months' })} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${calc.mode === 'months' ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-fmea-bg2 text-slate-600 dark:text-fmea-dim'}`}>Months</button>
                        <button type="button" onClick={() => setCalc({ ...calc, mode: 'weeks' })} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${calc.mode === 'weeks' ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-fmea-bg2 text-slate-600 dark:text-fmea-dim'}`}>Weeks</button>
                        {calc.mode === 'months'
                          ? <input type="number" placeholder="Duration (months)" value={calc.durationMonths} onChange={e => setCalc({ ...calc, durationMonths: e.target.value })} className="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-sm dark:text-fmea-text focus:outline-none focus:ring-1 focus:ring-cyan-400" />
                          : <input type="number" placeholder="Duration (weeks)" value={calc.durationWeeks} onChange={e => setCalc({ ...calc, durationWeeks: e.target.value })} className="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-sm dark:text-fmea-text focus:outline-none focus:ring-1 focus:ring-cyan-400" />
                        }
                      </div>
                      {calcTotal !== null && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-sm font-semibold text-slate-900 dark:text-fmea-hi">Total: {new Intl.NumberFormat('en-EU', { style: 'currency', currency: enquiry.currency || 'EUR', maximumFractionDigits: 0 }).format(calcTotal)}</span>
                          <button type="button" onClick={() => { setEnquiry({ ...enquiry, estimatedValue: calcTotal }); setCalcOpen(false) }} className="px-3 py-1.5 rounded-lg bg-cyan-500 text-white text-xs font-medium hover:bg-cyan-600 transition-colors">Apply to value</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div><label className={labelCls}>Currency</label>
                  <select value={enquiry.currency} onChange={e => setEnquiry({ ...enquiry, currency: e.target.value })} className={inputCls}>
                    <option value="EUR">EUR</option><option value="GBP">GBP</option><option value="USD">USD</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {saveError && <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{saveError}</div>}
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('input')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-700 dark:text-fmea-dim text-sm font-medium hover:bg-slate-200 dark:hover:bg-fmea-border transition-colors"><ArrowLeft className="h-4 w-4" />Back</button>
            <button onClick={handleCrmSave} disabled={saving} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all ${accentColor}`}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Confirm & save'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Review (Procurement) ── */}
      {step === 'review' && mode === 'procurement' && procExtracted && (
        <div className="space-y-5">
          {/* Project selector */}
          <div className="bg-white dark:bg-fmea-bg2 rounded-xl border-2 border-amber-400 dark:border-amber-500/50 p-5">
            <label className={amberLabelCls}>Attach to procurement project</label>
            {projects.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-fmea-dim">No open projects found. <a href="/procurement" className="text-amber-500 hover:underline">Create one first.</a></p>
            ) : (
              <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className={amberInputCls}>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{PROCUREMENT_CATEGORY_LABELS[p.category] ?? p.category} — {p.title}</option>
                ))}
              </select>
            )}
          </div>

          {/* Quote fields */}
          <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-fmea-hi">Quote Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className={amberLabelCls}>Supplier / firm name *</label><input value={supplierName} onChange={e => setSupplierName(e.target.value)} className={amberInputCls} placeholder="e.g. Thornton Solicitors" /></div>
              <div><label className={amberLabelCls}>Status</label>
                <select value={quoteStatus} onChange={e => setQuoteStatus(e.target.value)} className={amberInputCls}>
                  {QUOTE_STATUS_OPTIONS.map(s => <option key={s} value={s}>{QUOTE_STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1"><label className={amberLabelCls}>Fee</label><input type="number" placeholder="Amount" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} className={amberInputCls} /></div>
                <div className="w-24"><label className={amberLabelCls}>Currency</label>
                  <select value={feeCurrency} onChange={e => setFeeCurrency(e.target.value)} className={amberInputCls}>
                    <option value="EUR">EUR</option><option value="GBP">GBP</option><option value="USD">USD</option>
                  </select>
                </div>
                <div className="w-28"><label className={amberLabelCls}>Type</label>
                  <select value={feeType} onChange={e => setFeeType(e.target.value)} className={amberInputCls}>
                    {FEE_TYPES.map(t => <option key={t} value={t}>{FEE_TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div><label className={amberLabelCls}>Services offered</label><textarea value={servicesOffered} onChange={e => setServicesOffered(e.target.value)} rows={3} className={`${amberInputCls} resize-none`} /></div>
            <div><label className={amberLabelCls}>Availability / timeline</label><textarea value={availability} onChange={e => setAvailability(e.target.value)} rows={2} className={`${amberInputCls} resize-none`} /></div>
            <div><label className={amberLabelCls}>Experience &amp; capability</label><textarea value={experienceNotes} onChange={e => setExperienceNotes(e.target.value)} rows={2} className={`${amberInputCls} resize-none`} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={amberLabelCls}>Pros</label><textarea value={prosNotes} onChange={e => setProsNotes(e.target.value)} rows={2} className={`${amberInputCls} resize-none`} /></div>
              <div><label className={amberLabelCls}>Cons</label><textarea value={consNotes} onChange={e => setConsNotes(e.target.value)} rows={2} className={`${amberInputCls} resize-none`} /></div>
            </div>
          </div>

          {saveError && <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{saveError}</div>}
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('input')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-700 dark:text-fmea-dim text-sm font-medium hover:bg-slate-200 dark:hover:bg-fmea-border transition-colors"><ArrowLeft className="h-4 w-4" />Back</button>
            <button onClick={handleProcSave} disabled={saving || !selectedProjectId}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all ${accentColor}`}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save quote'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Done ── */}
      {step === 'done' && (
        <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-8 text-center">
          <div className={`inline-flex items-center justify-center h-14 w-14 rounded-full mb-4 ${mode === 'procurement' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
            <Check className={`h-7 w-7 ${mode === 'procurement' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-fmea-hi mb-1">Captured</h2>
          <p className="text-sm text-slate-500 dark:text-fmea-dim mb-6">
            {mode === 'procurement' ? 'Quote saved to your procurement project.' : `Contact, activity log${createdIds.opportunityId ? ', and opportunity' : ''} created.`}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {mode === 'procurement' && savedQuoteId && (
              <button onClick={() => router.push(`/procurement/${savedQuoteId}`)}
                className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors">
                View project
              </button>
            )}
            {mode === 'crm' && createdIds.contactId && (
              <button onClick={() => router.push(`/contacts/${createdIds.contactId}`)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-700 dark:text-fmea-text text-sm font-medium hover:bg-slate-200 dark:hover:bg-fmea-border transition-colors">
                View contact
              </button>
            )}
            {mode === 'crm' && createdIds.opportunityId && (
              <button onClick={() => router.push(`/opportunities/${createdIds.opportunityId}`)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-700 dark:text-fmea-text text-sm font-medium hover:bg-slate-200 dark:hover:bg-fmea-border transition-colors">
                View opportunity
              </button>
            )}
            <button onClick={resetState}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${accentColor}`}>
              Capture another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
