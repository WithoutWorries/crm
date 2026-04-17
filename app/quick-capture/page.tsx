'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, ArrowLeft, ArrowRight, Check, Loader2, AlertCircle } from 'lucide-react'

type Step = 'input' | 'review' | 'done'

interface Extracted {
  contact: {
    firstName: string | null
    lastName: string | null
    fullName: string | null
    company: string | null
    email: string | null
    phone: string | null
    linkedinUrl: string | null
    jobTitle: string | null
  }
  enquiry: {
    source: string
    subject: string
    summary: string
    originalExcerpt: string | null
    opportunityTitle: string | null
    estimatedValue: number | null
    currency: string
    nextAction: string | null
    urgency: string
  }
}

const SOURCE_LABELS: Record<string, string> = {
  EMAIL: 'Email',
  CALL: 'Phone call',
  LINKEDIN_MESSAGE: 'LinkedIn',
  OTHER: 'Other',
}

const PLACEHOLDER = `Paste an email, LinkedIn message, or type call notes here.

Examples:
• "Just had a call with Maria Schmidt at BASF. She's looking for FMEA support on a new reactor project starting Q3. Budget around €80k. Her email is m.schmidt@basf.com."
• Paste a full email directly
• Paste a LinkedIn connection message`

export default function QuickCapturePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('input')
  const [rawText, setRawText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [extracted, setExtracted] = useState<Extracted | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [createOpportunity, setCreateOpportunity] = useState(true)
  const [createdIds, setCreatedIds] = useState<{ contactId?: string; opportunityId?: string }>({})

  // Editable review fields
  const [contact, setContact] = useState<Extracted['contact']>({
    firstName: null, lastName: null, fullName: null, company: null,
    email: null, phone: null, linkedinUrl: null, jobTitle: null,
  })
  const [enquiry, setEnquiry] = useState<Extracted['enquiry']>({
    source: 'OTHER', subject: '', summary: '', originalExcerpt: null,
    opportunityTitle: null, estimatedValue: null, currency: 'EUR',
    nextAction: null, urgency: 'MEDIUM',
  })

  const handleExtract = async () => {
    if (!rawText.trim()) return
    setExtracting(true)
    setExtractError('')
    try {
      const res = await fetch('/api/quick-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      })
      const data = await res.json()
      if (!res.ok) { setExtractError(data.error || 'Extraction failed'); return }

      setExtracted(data)
      setContact(data.contact)
      setEnquiry(data.enquiry)
      setCreateOpportunity(!!data.enquiry.opportunityTitle)
      setStep('review')
    } catch {
      setExtractError('Something went wrong. Please try again.')
    } finally {
      setExtracting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const fullName = contact.fullName ||
        [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
        contact.company || 'Unknown'

      // 1. Create contact
      const contactRes = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: contact.firstName || fullName,
          lastName: contact.lastName || '',
          fullName,
          email: contact.email || null,
          phone: contact.phone || null,
          linkedinUrl: contact.linkedinUrl || null,
          jobTitle: contact.jobTitle || null,
          companyName: contact.company || null,
          influenceLevel: 'UNKNOWN',
          relationshipType: 'NEW',
        }),
      })
      const newContact = contactRes.ok ? await contactRes.json() : null
      const contactId = newContact?.id

      // 2. Log the activity
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: enquiry.source === 'EMAIL' ? 'EMAIL'
            : enquiry.source === 'CALL' ? 'CALL'
            : enquiry.source === 'LINKEDIN_MESSAGE' ? 'LINKEDIN_MESSAGE'
            : 'NOTE',
          subject: enquiry.subject,
          summary: enquiry.summary,
          nextStep: enquiry.nextAction || null,
          happenedAt: new Date(),
          contactId: contactId || null,
        }),
      })

      // 3. Optionally create opportunity
      let opportunityId: string | undefined
      if (createOpportunity && enquiry.opportunityTitle) {
        const oppRes = await fetch('/api/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: enquiry.opportunityTitle,
            description: enquiry.summary,
            stage: 'NEW_LEAD',
            companyId: null,
            primaryContactId: contactId || null,
            estimatedValue: enquiry.estimatedValue || null,
            currency: enquiry.currency || 'EUR',
            urgency: enquiry.urgency || 'MEDIUM',
            nextAction: enquiry.nextAction || null,
            projectPhase: 'UNKNOWN',
          }),
        })
        if (oppRes.ok) {
          const opp = await oppRes.json()
          opportunityId = opp.id
        }
      }

      setCreatedIds({ contactId, opportunityId })
      setStep('done')
    } catch {
      setSaveError('Failed to save. Please check the details and try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-fmea-accent text-sm'
  const labelCls = 'block text-xs font-medium text-slate-500 dark:text-fmea-dim mb-1 uppercase tracking-wide'

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-fmea-accent text-fmea-bg">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">Quick Capture</h1>
          <p className="text-sm text-slate-500 dark:text-fmea-dim">Paste an email, message, or call notes — AI fills in the rest</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(['input', 'review', 'done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step === s ? 'bg-fmea-accent text-fmea-bg'
              : (i < ['input','review','done'].indexOf(step)) ? 'bg-emerald-500 text-white'
              : 'bg-slate-200 dark:bg-fmea-bg3 text-slate-400 dark:text-fmea-dim'
            }`}>
              {i < ['input','review','done'].indexOf(step) ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step === s ? 'text-fmea-accent' : 'text-slate-400 dark:text-fmea-dim'}`}>
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
            onChange={(e) => setRawText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={12}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-fmea-border bg-slate-50 dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-fmea-accent text-sm resize-none"
          />
          {extractError && (
            <div className="mt-3 flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {extractError}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleExtract}
              disabled={!rawText.trim() || extracting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-fmea-accent text-fmea-bg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {extracting ? 'Extracting…' : 'Extract details'}
              {!extracting && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Review ── */}
      {step === 'review' && extracted && (
        <div className="space-y-5">
          {/* Contact card */}
          <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-fmea-hi mb-4">Contact Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>First name</label>
                <input value={contact.firstName ?? ''} onChange={e => setContact({ ...contact, firstName: e.target.value || null })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Last name</label>
                <input value={contact.lastName ?? ''} onChange={e => setContact({ ...contact, lastName: e.target.value || null })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Company</label>
                <input value={contact.company ?? ''} onChange={e => setContact({ ...contact, company: e.target.value || null })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Job title</label>
                <input value={contact.jobTitle ?? ''} onChange={e => setContact({ ...contact, jobTitle: e.target.value || null })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={contact.email ?? ''} onChange={e => setContact({ ...contact, email: e.target.value || null })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input value={contact.phone ?? ''} onChange={e => setContact({ ...contact, phone: e.target.value || null })} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>LinkedIn URL</label>
                <input value={contact.linkedinUrl ?? ''} onChange={e => setContact({ ...contact, linkedinUrl: e.target.value || null })} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Enquiry card */}
          <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-fmea-hi mb-4">Enquiry Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Source</label>
                  <select value={enquiry.source} onChange={e => setEnquiry({ ...enquiry, source: e.target.value })} className={inputCls}>
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Urgency</label>
                  <select value={enquiry.urgency} onChange={e => setEnquiry({ ...enquiry, urgency: e.target.value })} className={inputCls}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Activity subject</label>
                <input value={enquiry.subject} onChange={e => setEnquiry({ ...enquiry, subject: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Summary</label>
                <textarea value={enquiry.summary} onChange={e => setEnquiry({ ...enquiry, summary: e.target.value })} rows={3} className={inputCls} />
              </div>
              {enquiry.originalExcerpt && (
                <div>
                  <label className={labelCls}>Original language excerpt</label>
                  <div className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-fmea-border bg-slate-50 dark:bg-fmea-bg text-slate-500 dark:text-fmea-dim text-sm italic leading-relaxed">
                    {enquiry.originalExcerpt}
                  </div>
                </div>
              )}
              <div>
                <label className={labelCls}>Next action</label>
                <input value={enquiry.nextAction ?? ''} onChange={e => setEnquiry({ ...enquiry, nextAction: e.target.value || null })} className={inputCls} placeholder="e.g. Send capability statement" />
              </div>
            </div>
          </div>

          {/* Opportunity toggle */}
          <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-6">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input type="checkbox" checked={createOpportunity} onChange={e => setCreateOpportunity(e.target.checked)}
                className="w-4 h-4 rounded accent-fmea-accent" />
              <span className="text-sm font-semibold text-slate-900 dark:text-fmea-hi">Also create an Opportunity</span>
            </label>
            {createOpportunity && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Opportunity title</label>
                  <input value={enquiry.opportunityTitle ?? ''} onChange={e => setEnquiry({ ...enquiry, opportunityTitle: e.target.value || null })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Estimated value</label>
                  <input type="number" value={enquiry.estimatedValue ?? ''} onChange={e => setEnquiry({ ...enquiry, estimatedValue: e.target.value ? Number(e.target.value) : null })} className={inputCls} placeholder="0" />
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select value={enquiry.currency} onChange={e => setEnquiry({ ...enquiry, currency: e.target.value })} className={inputCls}>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {saveError && (
            <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {saveError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button onClick={() => setStep('input')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-700 dark:text-fmea-dim text-sm font-medium hover:bg-slate-200 dark:hover:bg-fmea-border transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-fmea-accent text-fmea-bg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Confirm & save'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Done ── */}
      {step === 'done' && (
        <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-8 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
            <Check className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-fmea-hi mb-1">Captured</h2>
          <p className="text-sm text-slate-500 dark:text-fmea-dim mb-6">Contact, activity log{createdIds.opportunityId ? ', and opportunity' : ''} created.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {createdIds.contactId && (
              <button onClick={() => router.push(`/contacts/${createdIds.contactId}`)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-700 dark:text-fmea-text text-sm font-medium hover:bg-slate-200 dark:hover:bg-fmea-border transition-colors">
                View contact
              </button>
            )}
            {createdIds.opportunityId && (
              <button onClick={() => router.push(`/opportunities/${createdIds.opportunityId}`)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-700 dark:text-fmea-text text-sm font-medium hover:bg-slate-200 dark:hover:bg-fmea-border transition-colors">
                View opportunity
              </button>
            )}
            <button onClick={() => { setStep('input'); setRawText(''); setExtracted(null) }}
              className="px-4 py-2 rounded-lg bg-fmea-accent text-fmea-bg text-sm font-medium hover:opacity-90 transition-opacity">
              Capture another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
