'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Briefcase, Plus, Clock, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import {
  PROCUREMENT_CATEGORY_LABELS,
  PROCUREMENT_CATEGORY_COLORS,
  PROCUREMENT_CATEGORY_BORDER,
  PROCUREMENT_STATUS_LABELS,
  PROCUREMENT_STATUS_COLORS,
} from '@/lib/constants'

interface QuoteSummary {
  id: string
  status: string
  feeAmount: string | null
  feeCurrency: string
}

interface Project {
  id: string
  title: string
  category: string
  status: string
  description: string | null
  decisionDeadline: string | null
  createdAt: string
  quotes: QuoteSummary[]
}

const CATEGORIES = ['LEGAL', 'ENGINEERING', 'FINANCIAL', 'IT', 'CONSTRUCTION', 'OTHER']

function deadlineInfo(iso: string | null): { label: string; urgent: boolean } | null {
  if (!iso) return null
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (days < 0)  return { label: 'Overdue',        urgent: true }
  if (days === 0) return { label: 'Due today',      urgent: true }
  if (days === 1) return { label: 'Due tomorrow',   urgent: true }
  if (days <= 7)  return { label: `${days} days`,   urgent: true }
  return           { label: `${days} days`,          urgent: false }
}

function costRange(quotes: QuoteSummary[]): string | null {
  const amounts = quotes
    .filter(q => q.feeAmount && q.status !== 'REJECTED')
    .map(q => Number(q.feeAmount))
  if (amounts.length === 0) return null
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)
  const currency = quotes[0]?.feeCurrency ?? 'EUR'
  const fmt = (n: number) => n.toLocaleString('en-DE', { style: 'currency', currency, maximumFractionDigits: 0 })
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`
}

export default function ProcurementPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(true)
  const [showNew, setShowNew]   = useState(false)
  const [form, setForm] = useState({ title: '', category: 'LEGAL', description: '', decisionDeadline: '', notes: '' })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [filter, setFilter]     = useState('ALL')

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    const res = await fetch('/api/procurement/projects')
    if (res.ok) setProjects(await res.json())
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/procurement/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:            form.title.trim(),
        category:         form.category,
        description:      form.description  || null,
        decisionDeadline: form.decisionDeadline || null,
        notes:            form.notes        || null,
      }),
    })
    if (res.ok) {
      await fetchProjects()
      setShowNew(false)
      setForm({ title: '', category: 'LEGAL', description: '', decisionDeadline: '', notes: '' })
    } else {
      const d = await res.json()
      setError(d.error || 'Failed to create project')
    }
    setSaving(false)
  }

  const visible = filter === 'ALL'
    ? projects
    : projects.filter(p => p.status === filter)

  const open    = projects.filter(p => p.status === 'OPEN').length
  const decided = projects.filter(p => p.status === 'DECIDED').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">Procurement</h1>
            <p className="text-sm text-slate-500 dark:text-fmea-dim">Compare suppliers &amp; track decisions</p>
          </div>
        </div>
        <button
          onClick={() => { setShowNew(true); setError('') }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/25"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-500 rounded-xl p-4 text-white shadow-lg shadow-amber-500/20">
          <Briefcase className="h-4 w-4 text-white/70 mb-1" />
          <p className="text-2xl font-bold">{projects.length}</p>
          <p className="text-xs text-white/80 mt-0.5">Total Projects</p>
        </div>
        <div className="bg-blue-600 rounded-xl p-4 text-white shadow-lg shadow-blue-600/20">
          <Circle className="h-4 w-4 text-white/70 mb-1" />
          <p className="text-2xl font-bold">{open}</p>
          <p className="text-xs text-white/80 mt-0.5">Open</p>
        </div>
        <div className="bg-emerald-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-600/20">
          <CheckCircle2 className="h-4 w-4 text-white/70 mb-1" />
          <p className="text-2xl font-bold">{decided}</p>
          <p className="text-xs text-white/80 mt-0.5">Decided</p>
        </div>
      </div>

      {/* New project form */}
      {showNew && (
        <div className="bg-white dark:bg-fmea-bg2 rounded-xl border-2 border-amber-400 dark:border-amber-500/50 p-5 space-y-4 shadow-lg shadow-amber-500/10">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-fmea-hi uppercase tracking-wide">New Procurement Project</h2>
          {error && <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Project title *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="col-span-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-sm dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-sm dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{PROCUREMENT_CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <input
              type="date"
              value={form.decisionDeadline}
              onChange={e => setForm(f => ({ ...f, decisionDeadline: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-sm dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-amber-400"
              title="Decision deadline (optional)"
            />
            <textarea
              placeholder="Brief description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="col-span-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-sm dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving}
              className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors">
              {saving ? 'Creating…' : 'Create Project'}
            </button>
            <button onClick={() => { setShowNew(false); setError('') }}
              className="px-4 py-2 rounded-lg text-slate-600 dark:text-fmea-dim text-sm hover:bg-slate-100 dark:hover:bg-fmea-bg3 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-fmea-bg3 p-1 rounded-lg w-fit">
        {['ALL', 'OPEN', 'DECIDED', 'ON_HOLD', 'CLOSED'].map(s => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filter === s
                ? 'bg-white dark:bg-fmea-bg2 text-slate-900 dark:text-fmea-hi shadow-sm'
                : 'text-slate-500 dark:text-fmea-dim hover:text-slate-700 dark:hover:text-fmea-text'
            }`}
          >
            {s === 'ALL' ? 'All' : PROCUREMENT_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Project cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 dark:text-fmea-dim">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-fmea-dim">
          {filter === 'ALL' ? 'No procurement projects yet. Create your first one above.' : `No ${PROCUREMENT_STATUS_LABELS[filter]?.toLowerCase()} projects.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map(project => {
            const dl = deadlineInfo(project.decisionDeadline)
            const range = costRange(project.quotes)
            const received = project.quotes.filter(q => q.status !== 'AWAITED').length
            const total    = project.quotes.length
            const border   = PROCUREMENT_CATEGORY_BORDER[project.category] ?? 'border-slate-400'

            return (
              <Link key={project.id} href={`/procurement/${project.id}`}>
                <div className={`bg-white dark:bg-fmea-bg2 rounded-xl border-l-4 ${border} border border-slate-200 dark:border-fmea-border hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200 group overflow-hidden`}>
                  <div className="p-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${PROCUREMENT_CATEGORY_COLORS[project.category]}`}>
                          {PROCUREMENT_CATEGORY_LABELS[project.category]}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${PROCUREMENT_STATUS_COLORS[project.status]}`}>
                          {PROCUREMENT_STATUS_LABELS[project.status]}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 dark:text-fmea-dim group-hover:text-amber-500 transition-colors shrink-0 mt-0.5" />
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-bold text-slate-900 dark:text-fmea-hi group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug mb-1">
                      {project.title}
                    </h2>
                    {project.description && (
                      <p className="text-xs text-slate-500 dark:text-fmea-dim line-clamp-2 mb-3">{project.description}</p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Quote progress */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
                            <div key={i} className={`h-2 w-4 rounded-sm ${i < received ? 'bg-amber-500' : 'bg-slate-200 dark:bg-fmea-bg3'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-fmea-dim">
                          {received}/{total} quote{total !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Cost range */}
                      {range && (
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                          {range}
                        </span>
                      )}

                      {/* Deadline */}
                      {dl && (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          dl.urgent
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-fmea-bg3 dark:text-fmea-dim'
                        }`}>
                          <Clock className="h-3 w-3" />
                          {dl.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
