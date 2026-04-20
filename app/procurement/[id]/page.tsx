'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Briefcase, Plus, Trash2, ChevronLeft, Pencil, Check, X,
  Banknote, CalendarClock, Star, ThumbsUp, ThumbsDown, Wrench,
} from 'lucide-react'
import {
  PROCUREMENT_CATEGORY_LABELS,
  PROCUREMENT_CATEGORY_COLORS,
  PROCUREMENT_STATUS_LABELS,
  PROCUREMENT_STATUS_COLORS,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
  FEE_TYPE_LABELS,
} from '@/lib/constants'

interface Supplier {
  id: string
  name: string
  website: string | null
  location: string | null
}

interface Quote {
  id: string
  status: string
  feeAmount: string | null
  feeCurrency: string
  feeType: string
  servicesOffered: string | null
  availability: string | null
  experienceNotes: string | null
  prosNotes: string | null
  consNotes: string | null
  receivedAt: string | null
  supplier: Supplier
}

interface Project {
  id: string
  title: string
  category: string
  status: string
  description: string | null
  decisionDeadline: string | null
  notes: string | null
  quotes: Quote[]
}

const QUOTE_STATUSES = ['AWAITED', 'RECEIVED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED']
const FEE_TYPES = ['TBC', 'FIXED', 'HOURLY', 'DAILY']
const PROJECT_STATUSES = ['OPEN', 'DECIDED', 'ON_HOLD', 'CLOSED']

const BLANK_QUOTE = {
  supplierName: '',
  status: 'RECEIVED',
  feeAmount: '',
  feeCurrency: 'EUR',
  feeType: 'TBC',
  servicesOffered: '',
  availability: '',
  experienceNotes: '',
  prosNotes: '',
  consNotes: '',
}

function formatFee(quote: Quote): string {
  if (!quote.feeAmount) return '—'
  const amount = Number(quote.feeAmount).toLocaleString('en-DE', {
    style: 'currency',
    currency: quote.feeCurrency,
    maximumFractionDigits: 0,
  })
  const type = FEE_TYPE_LABELS[quote.feeType] ?? ''
  return type && type !== 'TBC' ? `${amount} ${type}` : amount
}

function StatusChip({ value, colors }: { value: string; colors: Record<string, string> }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[value] ?? 'bg-slate-100 text-slate-600'}`}>
      {QUOTE_STATUS_LABELS[value] ?? value}
    </span>
  )
}

export default function ProcurementDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [quoteForm, setQuoteForm] = useState({ ...BLANK_QUOTE })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [editingProject, setEditingProject] = useState(false)
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null)
  const [editQuoteForm, setEditQuoteForm] = useState({ ...BLANK_QUOTE })
  const [projectForm, setProjectForm] = useState({ title: '', status: '', decisionDeadline: '', description: '', notes: '' })

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/procurement/projects/${id}`)
    if (res.ok) {
      const data = await res.json()
      setProject(data)
      setProjectForm({
        title:            data.title,
        status:           data.status,
        decisionDeadline: data.decisionDeadline ? data.decisionDeadline.slice(0, 10) : '',
        description:      data.description ?? '',
        notes:            data.notes ?? '',
      })
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchProject() }, [fetchProject])

  const handleAddQuote = async () => {
    if (!quoteForm.supplierName.trim()) { setError('Supplier name is required'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/procurement/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId:       id,
        supplierName:    quoteForm.supplierName.trim(),
        status:          quoteForm.status,
        feeAmount:       quoteForm.feeAmount ? Number(quoteForm.feeAmount) : null,
        feeCurrency:     quoteForm.feeCurrency,
        feeType:         quoteForm.feeType,
        servicesOffered: quoteForm.servicesOffered || null,
        availability:    quoteForm.availability    || null,
        experienceNotes: quoteForm.experienceNotes || null,
        prosNotes:       quoteForm.prosNotes        || null,
        consNotes:       quoteForm.consNotes        || null,
      }),
    })
    if (res.ok) {
      await fetchProject()
      setShowAdd(false)
      setQuoteForm({ ...BLANK_QUOTE })
    } else {
      const d = await res.json()
      setError(d.error || 'Failed to add quote')
    }
    setSaving(false)
  }

  const startEditQuote = (q: Quote) => {
    setEditingQuoteId(q.id)
    setEditQuoteForm({
      supplierName:    q.supplier.name,
      status:          q.status,
      feeAmount:       q.feeAmount ?? '',
      feeCurrency:     q.feeCurrency,
      feeType:         q.feeType,
      servicesOffered: q.servicesOffered ?? '',
      availability:    q.availability    ?? '',
      experienceNotes: q.experienceNotes ?? '',
      prosNotes:       q.prosNotes        ?? '',
      consNotes:       q.consNotes        ?? '',
    })
  }

  const handleSaveQuote = async (quoteId: string) => {
    setSaving(true)
    const res = await fetch(`/api/procurement/quotes/${quoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status:          editQuoteForm.status,
        feeAmount:       editQuoteForm.feeAmount ? Number(editQuoteForm.feeAmount) : null,
        feeCurrency:     editQuoteForm.feeCurrency,
        feeType:         editQuoteForm.feeType,
        servicesOffered: editQuoteForm.servicesOffered || null,
        availability:    editQuoteForm.availability    || null,
        experienceNotes: editQuoteForm.experienceNotes || null,
        prosNotes:       editQuoteForm.prosNotes        || null,
        consNotes:       editQuoteForm.consNotes        || null,
      }),
    })
    if (res.ok) { await fetchProject(); setEditingQuoteId(null) }
    setSaving(false)
  }

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm('Remove this quote?')) return
    await fetch(`/api/procurement/quotes/${quoteId}`, { method: 'DELETE' })
    fetchProject()
  }

  const handleSaveProject = async () => {
    setSaving(true)
    const res = await fetch(`/api/procurement/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:            projectForm.title,
        status:           projectForm.status,
        decisionDeadline: projectForm.decisionDeadline || null,
        description:      projectForm.description || null,
        notes:            projectForm.notes        || null,
      }),
    })
    if (res.ok) { await fetchProject(); setEditingProject(false) }
    setSaving(false)
  }

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its quotes? This cannot be undone.')) return
    await fetch(`/api/procurement/projects/${id}`, { method: 'DELETE' })
    router.push('/procurement')
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-sm dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-amber-400'
  const textareaCls = `${inputCls} resize-none`

  if (loading) return <div className="text-center py-16 text-slate-400 dark:text-fmea-dim">Loading…</div>
  if (!project) return <div className="text-center py-16 text-slate-400 dark:text-fmea-dim">Project not found.</div>

  return (
    <div className="space-y-6">

      {/* Back */}
      <button onClick={() => router.push('/procurement')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-fmea-dim hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Procurement
      </button>

      {/* Project header */}
      <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />
        <div className="p-6">
          {editingProject ? (
            <div className="space-y-3">
              <input value={projectForm.title} onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))}
                className={inputCls} placeholder="Project title" />
              <div className="grid grid-cols-2 gap-3">
                <select value={projectForm.status} onChange={e => setProjectForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                  {PROJECT_STATUSES.map(s => <option key={s} value={s}>{PROCUREMENT_STATUS_LABELS[s]}</option>)}
                </select>
                <input type="date" value={projectForm.decisionDeadline}
                  onChange={e => setProjectForm(f => ({ ...f, decisionDeadline: e.target.value }))} className={inputCls} />
              </div>
              <textarea value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}
                rows={2} className={textareaCls} placeholder="Description" />
              <textarea value={projectForm.notes} onChange={e => setProjectForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} className={textareaCls} placeholder="Notes" />
              <div className="flex gap-2">
                <button onClick={handleSaveProject} disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors">
                  <Check className="h-4 w-4" /> Save
                </button>
                <button onClick={() => setEditingProject(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-500 dark:text-fmea-dim text-sm hover:bg-slate-100 dark:hover:bg-fmea-bg3 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDeleteProject}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" /> Delete Project
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${PROCUREMENT_CATEGORY_COLORS[project.category]}`}>
                    {PROCUREMENT_CATEGORY_LABELS[project.category]}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${PROCUREMENT_STATUS_COLORS[project.status]}`}>
                    {PROCUREMENT_STATUS_LABELS[project.status]}
                  </span>
                  {project.decisionDeadline && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-fmea-dim">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Decide by {new Date(project.decisionDeadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">{project.title}</h1>
                {project.description && <p className="text-sm text-slate-500 dark:text-fmea-dim">{project.description}</p>}
                {project.notes && (
                  <p className="text-sm text-slate-600 dark:text-fmea-text bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-lg px-3 py-2">
                    {project.notes}
                  </p>
                )}
              </div>
              <button onClick={() => setEditingProject(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors shrink-0">
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comparison table */}
      {project.quotes.length > 0 && (
        <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-fmea-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-fmea-hi uppercase tracking-wide">Comparison</h2>
            <span className="text-xs text-slate-400 dark:text-fmea-dim">{project.quotes.length} supplier{project.quotes.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-fmea-bg3">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-fmea-dim uppercase tracking-wide w-32 sticky left-0 bg-slate-50 dark:bg-fmea-bg3 z-10">Field</th>
                  {project.quotes.map(q => (
                    <th key={q.id} className="px-4 py-3 text-left min-w-48">
                      <div className="font-bold text-slate-900 dark:text-fmea-hi">{q.supplier.name}</div>
                      <StatusChip value={q.status} colors={QUOTE_STATUS_COLORS} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-fmea-border">
                {/* Fee */}
                <tr>
                  <td className="px-4 py-3 sticky left-0 bg-white dark:bg-fmea-bg2 z-10">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-fmea-dim uppercase tracking-wide">
                      <Banknote className="h-3.5 w-3.5 text-emerald-500" /> Fee
                    </span>
                  </td>
                  {project.quotes.map(q => (
                    <td key={q.id} className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400">{formatFee(q)}</td>
                  ))}
                </tr>
                {/* Services */}
                <tr className="bg-slate-50/50 dark:bg-fmea-bg3/30">
                  <td className="px-4 py-3 sticky left-0 bg-slate-50/50 dark:bg-fmea-bg3/30 z-10">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-fmea-dim uppercase tracking-wide">
                      <Wrench className="h-3.5 w-3.5 text-blue-500" /> Services
                    </span>
                  </td>
                  {project.quotes.map(q => (
                    <td key={q.id} className="px-4 py-3 text-sm text-slate-700 dark:text-fmea-text whitespace-pre-wrap">{q.servicesOffered || <span className="text-slate-300 dark:text-fmea-dim">—</span>}</td>
                  ))}
                </tr>
                {/* Availability */}
                <tr>
                  <td className="px-4 py-3 sticky left-0 bg-white dark:bg-fmea-bg2 z-10">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-fmea-dim uppercase tracking-wide">
                      <CalendarClock className="h-3.5 w-3.5 text-indigo-500" /> Availability
                    </span>
                  </td>
                  {project.quotes.map(q => (
                    <td key={q.id} className="px-4 py-3 text-sm text-slate-700 dark:text-fmea-text">{q.availability || <span className="text-slate-300 dark:text-fmea-dim">—</span>}</td>
                  ))}
                </tr>
                {/* Experience */}
                <tr className="bg-slate-50/50 dark:bg-fmea-bg3/30">
                  <td className="px-4 py-3 sticky left-0 bg-slate-50/50 dark:bg-fmea-bg3/30 z-10">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-fmea-dim uppercase tracking-wide">
                      <Star className="h-3.5 w-3.5 text-amber-500" /> Experience
                    </span>
                  </td>
                  {project.quotes.map(q => (
                    <td key={q.id} className="px-4 py-3 text-sm text-slate-700 dark:text-fmea-text whitespace-pre-wrap">{q.experienceNotes || <span className="text-slate-300 dark:text-fmea-dim">—</span>}</td>
                  ))}
                </tr>
                {/* Pros */}
                <tr>
                  <td className="px-4 py-3 sticky left-0 bg-white dark:bg-fmea-bg2 z-10">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-fmea-dim uppercase tracking-wide">
                      <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" /> Pros
                    </span>
                  </td>
                  {project.quotes.map(q => (
                    <td key={q.id} className="px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap">{q.prosNotes || <span className="text-slate-300 dark:text-fmea-dim">—</span>}</td>
                  ))}
                </tr>
                {/* Cons */}
                <tr className="bg-slate-50/50 dark:bg-fmea-bg3/30">
                  <td className="px-4 py-3 sticky left-0 bg-slate-50/50 dark:bg-fmea-bg3/30 z-10">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-fmea-dim uppercase tracking-wide">
                      <ThumbsDown className="h-3.5 w-3.5 text-rose-500" /> Cons
                    </span>
                  </td>
                  {project.quotes.map(q => (
                    <td key={q.id} className="px-4 py-3 text-sm text-rose-700 dark:text-rose-400 whitespace-pre-wrap">{q.consNotes || <span className="text-slate-300 dark:text-fmea-dim">—</span>}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quote cards (edit / delete) */}
      {project.quotes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-fmea-dim uppercase tracking-wide px-1">Quote Details</h2>
          {project.quotes.map(q => (
            <div key={q.id} className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border overflow-hidden">
              {editingQuoteId === q.id ? (
                <div className="p-5 space-y-3">
                  <p className="text-sm font-bold text-slate-900 dark:text-fmea-hi">{q.supplier.name}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <select value={editQuoteForm.status} onChange={e => setEditQuoteForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                      {QUOTE_STATUSES.map(s => <option key={s} value={s}>{QUOTE_STATUS_LABELS[s]}</option>)}
                    </select>
                    <input placeholder="Fee amount" type="number" value={editQuoteForm.feeAmount}
                      onChange={e => setEditQuoteForm(f => ({ ...f, feeAmount: e.target.value }))} className={inputCls} />
                    <select value={editQuoteForm.feeType} onChange={e => setEditQuoteForm(f => ({ ...f, feeType: e.target.value }))} className={inputCls}>
                      {FEE_TYPES.map(t => <option key={t} value={t}>{FEE_TYPE_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <textarea placeholder="Services offered" value={editQuoteForm.servicesOffered}
                    onChange={e => setEditQuoteForm(f => ({ ...f, servicesOffered: e.target.value }))} rows={2} className={textareaCls} />
                  <textarea placeholder="Availability / timeline" value={editQuoteForm.availability}
                    onChange={e => setEditQuoteForm(f => ({ ...f, availability: e.target.value }))} rows={2} className={textareaCls} />
                  <textarea placeholder="Experience &amp; capability" value={editQuoteForm.experienceNotes}
                    onChange={e => setEditQuoteForm(f => ({ ...f, experienceNotes: e.target.value }))} rows={2} className={textareaCls} />
                  <div className="grid grid-cols-2 gap-3">
                    <textarea placeholder="Pros" value={editQuoteForm.prosNotes}
                      onChange={e => setEditQuoteForm(f => ({ ...f, prosNotes: e.target.value }))} rows={2} className={textareaCls} />
                    <textarea placeholder="Cons" value={editQuoteForm.consNotes}
                      onChange={e => setEditQuoteForm(f => ({ ...f, consNotes: e.target.value }))} rows={2} className={textareaCls} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveQuote(q.id)} disabled={saving}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors">
                      <Check className="h-4 w-4" /> Save
                    </button>
                    <button onClick={() => setEditingQuoteId(null)}
                      className="px-3 py-1.5 rounded-lg text-slate-500 dark:text-fmea-dim text-sm hover:bg-slate-100 dark:hover:bg-fmea-bg3 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 dark:text-fmea-hi">{q.supplier.name}</p>
                      <StatusChip value={q.status} colors={QUOTE_STATUS_COLORS} />
                      {q.feeAmount && (
                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{formatFee(q)}</span>
                      )}
                    </div>
                    {q.servicesOffered && <p className="text-xs text-slate-500 dark:text-fmea-dim line-clamp-1">{q.servicesOffered}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEditQuote(q)}
                      className="p-1.5 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteQuote(q.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add quote */}
      <div className="bg-white dark:bg-fmea-bg2 rounded-xl border-2 border-dashed border-slate-300 dark:border-fmea-border overflow-hidden">
        {showAdd ? (
          <div className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-fmea-hi flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-amber-500" />
              Log a Quote / Response
            </h3>
            {error && <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Supplier / firm name *" value={quoteForm.supplierName}
                onChange={e => setQuoteForm(f => ({ ...f, supplierName: e.target.value }))}
                className={`col-span-2 ${inputCls}`} />
              <select value={quoteForm.status} onChange={e => setQuoteForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                {QUOTE_STATUSES.map(s => <option key={s} value={s}>{QUOTE_STATUS_LABELS[s]}</option>)}
              </select>
              <div className="flex gap-2">
                <input placeholder="Fee (e.g. 1500)" type="number" value={quoteForm.feeAmount}
                  onChange={e => setQuoteForm(f => ({ ...f, feeAmount: e.target.value }))} className={inputCls} />
                <select value={quoteForm.feeType} onChange={e => setQuoteForm(f => ({ ...f, feeType: e.target.value }))} className="w-28 px-2 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-sm dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {FEE_TYPES.map(t => <option key={t} value={t}>{FEE_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
            </div>
            <textarea placeholder="Services offered" value={quoteForm.servicesOffered}
              onChange={e => setQuoteForm(f => ({ ...f, servicesOffered: e.target.value }))} rows={2} className={textareaCls} />
            <textarea placeholder="Availability / timeline" value={quoteForm.availability}
              onChange={e => setQuoteForm(f => ({ ...f, availability: e.target.value }))} rows={2} className={textareaCls} />
            <textarea placeholder="Experience &amp; capability" value={quoteForm.experienceNotes}
              onChange={e => setQuoteForm(f => ({ ...f, experienceNotes: e.target.value }))} rows={2} className={textareaCls} />
            <div className="grid grid-cols-2 gap-3">
              <textarea placeholder="Pros" value={quoteForm.prosNotes}
                onChange={e => setQuoteForm(f => ({ ...f, prosNotes: e.target.value }))} rows={2} className={textareaCls} />
              <textarea placeholder="Cons" value={quoteForm.consNotes}
                onChange={e => setQuoteForm(f => ({ ...f, consNotes: e.target.value }))} rows={2} className={textareaCls} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddQuote} disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-md shadow-amber-500/25">
                <Plus className="h-4 w-4" />
                {saving ? 'Saving…' : 'Add Quote'}
              </button>
              <button onClick={() => { setShowAdd(false); setError('') }}
                className="px-4 py-2 rounded-lg text-slate-500 dark:text-fmea-dim text-sm hover:bg-slate-100 dark:hover:bg-fmea-bg3 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 py-5 text-sm font-semibold text-slate-400 dark:text-fmea-dim hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
            <Plus className="h-4 w-4" />
            Log a quote or response
          </button>
        )}
      </div>

    </div>
  )
}
