'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, RotateCcw, Trash2 } from 'lucide-react'

interface DeletedKnowledgeNote {
  id: string
  title: string | null
  content: string
  deletedAt: string | null
}

function daysRemaining(deletedAt: string | null): number {
  if (!deletedAt) return 30
  const purgeAt = new Date(deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000
  return Math.max(0, Math.ceil((purgeAt - Date.now()) / (24 * 60 * 60 * 1000)))
}

function preview(content: string): string {
  const compact = content.replace(/\s+/g, ' ').trim()
  return compact.length > 240 ? `${compact.slice(0, 237).trimEnd()}…` : compact
}

export default function RecentlyDeletedKnowledgePage() {
  const [notes, setNotes] = useState<DeletedKnowledgeNote[]>([])
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/knowledge?deleted=true&limit=50', { cache: 'no-store' })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Unable to load deleted notes')
      setNotes(data.notes)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load deleted notes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const restore = async (id: string) => {
    setWorkingId(id)
    setError('')
    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Unable to restore note')
      setNotes((current) => current.filter((note) => note.id !== id))
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Unable to restore note')
    } finally {
      setWorkingId(null)
    }
  }

  const permanentlyDelete = async (id: string) => {
    setWorkingId(id)
    setError('')
    try {
      const response = await fetch(`/api/knowledge/${id}?permanent=true`, { method: 'DELETE' })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Unable to permanently delete note')
      setNotes((current) => current.filter((note) => note.id !== id))
      setConfirmingId(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to permanently delete note')
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/knowledge"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-fmea-dim dark:hover:text-fmea-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Knowledge
      </Link>

      <header className="mt-7 border-b border-slate-200 pb-6 dark:border-fmea-border">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">
          Recovery
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-fmea-hi">
          Recently Deleted
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-fmea-dim">
          Restore a note or remove it permanently. Notes are automatically deleted after 30 days.
        </p>
      </header>

      {error && (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-slate-500 dark:text-fmea-dim">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading deleted notes…
        </div>
      ) : notes.length === 0 ? (
        <div className="py-16">
          <Trash2 className="h-7 w-7 text-slate-300 dark:text-fmea-border2" />
          <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-fmea-hi">
            Recently Deleted is empty
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-fmea-dim">
            Deleted Knowledge notes will remain recoverable here for 30 days.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-fmea-border">
          {notes.map((note) => {
            const remaining = daysRemaining(note.deletedAt)
            const working = workingId === note.id
            const confirming = confirmingId === note.id
            return (
              <article key={note.id} className="py-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-fmea-hi">
                      {note.title || 'Untitled note'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {preview(note.content)}
                    </p>
                    <p className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-300">
                      {remaining} {remaining === 1 ? 'day' : 'days'} remaining
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => restore(note.id)}
                      disabled={working}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-fmea-border dark:bg-fmea-bg2 dark:text-fmea-text dark:hover:bg-fmea-bg3"
                    >
                      {working && !confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                      Restore
                    </button>
                    {!confirming ? (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(note.id)}
                        disabled={working}
                        className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete permanently
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2 dark:border-rose-900/60 dark:bg-rose-950/30">
                        <span className="px-1 text-xs font-semibold text-rose-800 dark:text-rose-200">Cannot be undone</span>
                        <button
                          type="button"
                          onClick={() => permanentlyDelete(note.id)}
                          disabled={working}
                          className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
                        >
                          {working ? 'Deleting…' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          disabled={working}
                          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-50 dark:text-fmea-dim dark:hover:bg-fmea-bg2"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
