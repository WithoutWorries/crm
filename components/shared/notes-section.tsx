'use client'

import { useEffect, useState } from 'react'
import { StickyNote, Pencil, Trash2, Check, X, Plus } from 'lucide-react'

interface Note {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

interface NotesSectionProps {
  contactId?: string
  companyId?: string
  opportunityId?: string
}

function formatNoteDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function NotesSection({ contactId, companyId, opportunityId }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const queryParam = contactId
    ? `contactId=${contactId}`
    : companyId
    ? `companyId=${companyId}`
    : `opportunityId=${opportunityId}`

  useEffect(() => {
    fetchNotes()
  }, [contactId, companyId, opportunityId])

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/notes?${queryParam}`)
      if (res.ok) {
        const data = await res.json()
        setNotes(data)
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newContent.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          ...(contactId ? { contactId } : {}),
          ...(companyId ? { companyId } : {}),
          ...(opportunityId ? { opportunityId } : {}),
        }),
      })
      if (res.ok) {
        const note = await res.json()
        setNotes([note, ...notes])
        setNewContent('')
      }
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditStart = (note: Note) => {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  const handleEditSave = async (id: string) => {
    if (!editContent.trim()) return
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })
      if (res.ok) {
        const updated = await res.json()
        setNotes(notes.map((n) => (n.id === id ? updated : n)))
        setEditingId(null)
      }
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setNotes(notes.filter((n) => n.id !== id))
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <StickyNote className="h-5 w-5 text-amber-500 dark:text-amber-400" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notes</h3>
        {notes.length > 0 && (
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </span>
        )}
      </div>

      {/* Add note */}
      <div className="mb-6">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd()
          }}
          placeholder="Add a note… (⌘↵ to save)"
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAdd}
            disabled={!newContent.trim() || submitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-4 w-4" />
            {submitting ? 'Saving…' : 'Add note'}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No notes yet. Add the first one above.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group relative rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4"
            >
              {editingId === note.id ? (
                /* Edit mode */
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <div className="flex gap-2 mt-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEditSave(note.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
                  <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed pr-16">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {formatNoteDate(note.createdAt)}
                      {note.updatedAt !== note.createdAt && ' · edited'}
                    </span>
                  </div>
                  {/* Action buttons — visible on hover */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditStart(note)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                      title="Edit note"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      disabled={deletingId === note.id}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                      title="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
