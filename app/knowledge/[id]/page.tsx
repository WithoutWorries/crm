'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, ExternalLink, Loader2, Pencil, X } from 'lucide-react'
import type { KnowledgeType } from '@prisma/client'
import { KNOWLEDGE_TYPES, KNOWLEDGE_TYPE_LABELS } from '@/lib/knowledge'

interface KnowledgeNote {
  id: string
  title: string | null
  content: string
  knowledgeType: KnowledgeType | null
  sourceUrl: string | null
  createdAt: string
  updatedAt: string
}

interface EditState {
  title: string
  content: string
  knowledgeType: KnowledgeType | ''
  sourceUrl: string
}

function toEditState(note: KnowledgeNote): EditState {
  return {
    title: note.title ?? '',
    content: note.content,
    knowledgeType: note.knowledgeType ?? '',
    sourceUrl: note.sourceUrl ?? '',
  }
}

function formatFullDate(value: string): string {
  return new Date(value).toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function KnowledgeNotePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [note, setNote] = useState<KnowledgeNote | null>(null)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`/api/knowledge/${params.id}`, { cache: 'no-store' })
        if (response.status === 404) {
          router.replace('/knowledge')
          return
        }
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load note')
        setNote(data)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load note')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [params.id, router])

  const beginEditing = () => {
    if (!note) return
    setEdit(toEditState(note))
    setError('')
  }

  const save = async () => {
    if (!edit?.content.trim() || saving) return
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/knowledge/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: edit.title,
          content: edit.content,
          knowledgeType: edit.knowledgeType || null,
          sourceUrl: edit.sourceUrl,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to update note')
      setNote(data)
      setEdit(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update note')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center gap-2 py-20 text-sm text-slate-500 dark:text-fmea-dim">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading note…
      </div>
    )
  }

  if (!note) {
    return (
      <div className="mx-auto max-w-3xl py-20">
        <p className="text-sm text-rose-700 dark:text-rose-300">{error || 'Note not found'}</p>
        <Link href="/knowledge" className="mt-4 inline-flex text-sm font-semibold text-cyan-700 dark:text-fmea-accent">
          Return to knowledge
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-fmea-dim dark:hover:text-fmea-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </Link>
        {!edit && (
          <button
            onClick={beginEditing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-fmea-border dark:bg-fmea-bg2 dark:text-fmea-text dark:hover:bg-fmea-bg3"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {edit ? (
        <div className="space-y-6">
          <div>
            <label htmlFor="note-title" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-fmea-dim">
              Title
            </label>
            <input
              id="note-title"
              value={edit.title}
              onChange={(event) => setEdit({ ...edit, title: event.target.value })}
              maxLength={200}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-xl font-semibold text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 dark:border-fmea-border dark:bg-fmea-bg2 dark:text-fmea-hi dark:focus:border-fmea-accent dark:focus:ring-cyan-950/40"
            />
          </div>

          <div>
            <label htmlFor="note-content" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-fmea-dim">
              Note
            </label>
            <textarea
              id="note-content"
              value={edit.content}
              onChange={(event) => setEdit({ ...edit, content: event.target.value })}
              rows={18}
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-4 text-base leading-7 text-slate-900 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 dark:border-fmea-border dark:bg-fmea-bg2 dark:text-fmea-text dark:focus:border-fmea-accent dark:focus:ring-cyan-950/40"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="knowledge-type" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-fmea-dim">
                Type <span className="normal-case tracking-normal text-slate-400">(optional)</span>
              </label>
              <select
                id="knowledge-type"
                value={edit.knowledgeType}
                onChange={(event) => setEdit({ ...edit, knowledgeType: event.target.value as KnowledgeType | '' })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 dark:border-fmea-border dark:bg-fmea-bg2 dark:text-fmea-text"
              >
                <option value="">Not classified</option>
                {KNOWLEDGE_TYPES.map((type) => (
                  <option key={type} value={type}>{KNOWLEDGE_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="source-url" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-fmea-dim">
                Source link <span className="normal-case tracking-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="source-url"
                type="url"
                value={edit.sourceUrl}
                onChange={(event) => setEdit({ ...edit, sourceUrl: event.target.value })}
                placeholder="https://…"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 dark:border-fmea-border dark:bg-fmea-bg2 dark:text-fmea-text"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-fmea-border sm:flex-row sm:justify-end">
            <button
              onClick={() => {
                setEdit(null)
                setError('')
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-fmea-border dark:bg-fmea-bg2 dark:text-fmea-text dark:hover:bg-fmea-bg3"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!edit.content.trim() || saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-40 dark:bg-fmea-accent dark:text-fmea-bg"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      ) : (
        <article>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-fmea-dim">
            {note.knowledgeType && (
              <span className="font-semibold uppercase tracking-[0.1em] text-amber-700 dark:text-amber-400">
                {KNOWLEDGE_TYPE_LABELS[note.knowledgeType]}
              </span>
            )}
            <time>{formatFullDate(note.updatedAt)}</time>
            {note.updatedAt !== note.createdAt && <span>Edited</span>}
          </div>

          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-fmea-hi sm:text-4xl">
            {note.title || 'Untitled note'}
          </h1>

          <div className="mt-8 whitespace-pre-wrap border-t border-slate-200 pt-8 text-base leading-8 text-slate-800 dark:border-fmea-border dark:text-fmea-text sm:text-lg">
            {note.content}
          </div>

          {note.sourceUrl && (
            <a
              href={note.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-900 dark:text-fmea-accent dark:hover:text-cyan-300"
            >
              Open source
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </article>
      )}
    </div>
  )
}
