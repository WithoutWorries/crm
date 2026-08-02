'use client'

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CloudOff,
  HardDrive,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { KNOWLEDGE_TYPE_LABELS } from '@/lib/knowledge'
import type { KnowledgeType } from '@prisma/client'
import {
  useOfflineKnowledgeQueue,
  type SyncedKnowledgeNote,
} from '@/hooks/use-offline-knowledge-queue'

interface KnowledgeNote {
  id: string
  title: string | null
  content: string
  knowledgeType: KnowledgeType | null
  sourceUrl: string | null
  capturedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

function formatNoteDate(value: string): string {
  const date = new Date(value)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const noteDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const daysAgo = Math.round((today.getTime() - noteDay.getTime()) / 86_400_000)

  if (daysAgo === 0) {
    return `Today ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (daysAgo === 1) return 'Yesterday'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric' })
}

function notePreview(content: string): string {
  const compact = content.replace(/\s+/g, ' ').trim()
  if (compact.length <= 300) return compact
  return `${compact.slice(0, 297).trimEnd()}…`
}

export default function KnowledgePage() {
  const searchRef = useRef<HTMLInputElement>(null)
  const captureRef = useRef<HTMLTextAreaElement>(null)
  const [query, setQuery] = useState('')
  const [notes, setNotes] = useState<KnowledgeNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleSyncedNote = useCallback(
    (note: SyncedKnowledgeNote) => {
      if (!query) {
        setNotes((current) => [note, ...current.filter((item) => item.id !== note.id)])
      }
    },
    [query]
  )

  const {
    draft: capture,
    setDraft: setCapture,
    queueCapture,
    pendingCount,
    isOnline,
    queueState,
    statusDetail,
    ready: offlineQueueReady,
  } = useOfflineKnowledgeQueue(handleSyncedNote)

  const loadNotes = useCallback(async (searchQuery: string) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ limit: '40' })
      if (searchQuery.trim()) params.set('q', searchQuery.trim())
      const response = await fetch(`/api/knowledge?${params.toString()}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load notes')
      setNotes(data.notes)
    } catch (loadError) {
      setError(
        !navigator.onLine
          ? 'Offline — recent notes and search will return when connected. Capture remains available.'
          : loadError instanceof Error
            ? loadError.message
            : 'Unable to load notes'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => loadNotes(query), query ? 240 : 0)
    return () => clearTimeout(timeout)
  }, [query, loadNotes])

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
        return
      }

      if (event.key === '/' && !isTyping) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const saveCapture = async () => {
    if (!capture.trim() || queueState === 'SAVING_LOCAL') return
    setError('')
    const queued = await queueCapture()
    if (queued) {
      captureRef.current?.focus()
    }
  }

  const handleCaptureKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      saveCapture()
    }
  }

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault()
    loadNotes(query)
  }

  const resultHeading = query ? `Results for “${query}”` : 'Recent knowledge'

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 sm:mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-fmea-accent">
          Reference
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-fmea-hi sm:text-3xl">
              Find what you already know.
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-fmea-dim">
              Your private record of decisions, fixes, references, and things worth remembering.
            </p>
          </div>
          <span className="hidden text-xs text-slate-400 dark:text-fmea-dim sm:block">Press / from anywhere</span>
        </div>
      </header>

      <form onSubmit={handleSearchSubmit} className="mb-3">
        <label className="group flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm transition focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-100 dark:border-fmea-border dark:bg-fmea-bg2 dark:focus-within:border-fmea-accent dark:focus-within:ring-cyan-950/40 sm:px-5 sm:py-4">
          <Search className="h-5 w-5 shrink-0 text-cyan-700 dark:text-fmea-accent" aria-hidden="true" />
          <span className="sr-only">Search all knowledge</span>
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search everything — try “Why did I reject Lucid?”"
            className="min-w-0 flex-1 bg-transparent text-base text-slate-950 outline-none placeholder:text-slate-400 dark:text-fmea-text dark:placeholder:text-fmea-dim sm:text-lg"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                searchRef.current?.focus()
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-fmea-bg3 dark:hover:text-fmea-text"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-400 dark:border-fmea-border dark:bg-fmea-bg3 dark:text-fmea-dim sm:block">
              ⌘ K
            </kbd>
          )}
        </label>
      </form>

      <div className="mb-8 flex items-center justify-between px-1 text-xs text-slate-500 dark:text-fmea-dim">
        <span>Searches titles and full note content</span>
        <div className="flex items-center gap-4">
          <Link
            href="/knowledge/deleted"
            className="inline-flex items-center gap-1.5 font-medium text-slate-500 hover:text-slate-800 dark:text-fmea-dim dark:hover:text-fmea-text"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Recently deleted
          </Link>
          <button
            type="button"
            onClick={() => captureRef.current?.focus()}
            className="inline-flex items-center gap-1.5 font-semibold text-cyan-700 hover:text-cyan-900 dark:text-fmea-accent dark:hover:text-cyan-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Capture something
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <section className="order-2 min-w-0 lg:order-1" aria-live="polite">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-fmea-dim">
              {resultHeading}
            </h2>
            {!loading && (
              <span className="text-xs text-slate-400 dark:text-fmea-dim">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </span>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-fmea-border">
            {loading ? (
              <div className="flex items-center gap-2 py-10 text-sm text-slate-500 dark:text-fmea-dim">
                <Loader2 className="h-4 w-4 animate-spin" />
                {query ? 'Searching…' : 'Loading recent notes…'}
              </div>
            ) : notes.length === 0 ? (
              <div className="py-12">
                <BookOpen className="mb-4 h-7 w-7 text-slate-300 dark:text-fmea-border2" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-fmea-text">
                  {query ? 'Nothing matched that search' : 'Nothing captured yet'}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-fmea-dim">
                  {query
                    ? 'Try a name, project, decision, or a phrase you remember using.'
                    : 'Start with one thing you would be irritated to research again.'}
                </p>
              </div>
            ) : (
              notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/knowledge/${note.id}`}
                  className="group block border-b border-slate-200 py-5 transition hover:bg-white/60 dark:border-fmea-border dark:hover:bg-fmea-bg2/40 sm:px-1 sm:py-6"
                >
                  <h3 className="text-base font-semibold leading-6 text-slate-900 transition group-hover:text-cyan-800 dark:text-fmea-hi dark:group-hover:text-fmea-accent sm:text-lg">
                    {note.title || 'Untitled note'}
                  </h3>
                  <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {notePreview(note.content)}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-fmea-dim">
                    {note.knowledgeType && (
                      <span className="font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-400">
                        {KNOWLEDGE_TYPE_LABELS[note.knowledgeType]}
                      </span>
                    )}
                    <span>{formatNoteDate(note.capturedAt ?? note.updatedAt)}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <aside className="order-1 lg:order-2">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 shadow-sm dark:border-fmea-border dark:bg-fmea-bg2 lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-fmea-hi">Quick capture</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-fmea-dim">
              What would be annoying to rediscover?
            </p>
            <div
              className={`mt-4 rounded-xl border px-3 py-2.5 ${
                queueState === 'ERROR'
                  ? 'border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30'
                  : !isOnline || queueState === 'PENDING' || queueState === 'AUTH_REQUIRED'
                    ? 'border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/25'
                    : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/25'
              }`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-2.5">
                {queueState === 'INITIALISING' ||
                queueState === 'SAVING_LOCAL' ||
                queueState === 'SYNCING' ? (
                  <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-cyan-700 dark:text-fmea-accent" />
                ) : queueState === 'ERROR' ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
                ) : !isOnline ? (
                  <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                ) : pendingCount ? (
                  <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold leading-4 text-slate-700 dark:text-slate-200">
                    {statusDetail}
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-fmea-dim">
                    {pendingCount
                      ? `${pendingCount} ${pendingCount === 1 ? 'note' : 'notes'} awaiting server confirmation`
                      : 'Drafts are retained on this device until submitted'}
                  </p>
                </div>
              </div>
            </div>
            <textarea
              id="capture"
              ref={captureRef}
              value={capture}
              onChange={(event) => setCapture(event.target.value)}
              onKeyDown={handleCaptureKeyDown}
              placeholder="Paste a solution, decision, useful link, calculation, or lesson…"
              rows={8}
              className="mt-4 w-full resize-y rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 dark:border-fmea-border dark:bg-fmea-bg dark:text-fmea-text dark:placeholder:text-fmea-dim dark:focus:border-fmea-accent dark:focus:ring-cyan-950/40 lg:min-h-52"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 dark:text-fmea-dim">⌘ Enter to save</span>
              <button
                type="button"
                onClick={saveCapture}
                disabled={
                  !capture.trim() || queueState === 'SAVING_LOCAL' || !offlineQueueReady
                }
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-fmea-accent dark:text-fmea-bg dark:hover:bg-cyan-300"
              >
                {queueState === 'SAVING_LOCAL' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isOnline ? (
                  <Plus className="h-4 w-4" />
                ) : (
                  <HardDrive className="h-4 w-4" />
                )}
                {queueState === 'SAVING_LOCAL'
                  ? 'Securing…'
                  : isOnline
                    ? 'Save'
                    : 'Save locally'}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
