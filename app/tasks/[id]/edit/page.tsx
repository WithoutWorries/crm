'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PRIORITY_LABELS } from '@/lib/constants'
import { ArrowLeft } from 'lucide-react'

interface Contact { id: string; fullName: string }
interface Opportunity { id: string; title: string }

export default function EditTaskPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM',
    status: 'PENDING',
    contactId: '',
    opportunityId: '',
  })

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [taskRes, contactsRes, oppsRes] = await Promise.all([
          fetch(`/api/tasks/${id}`),
          fetch('/api/contacts'),
          fetch('/api/opportunities'),
        ])
        if (!taskRes.ok) { router.push('/tasks'); return }
        const task = await taskRes.json()
        const contactsData = await contactsRes.json()
        const oppsData = await oppsRes.json()

        setContacts(Array.isArray(contactsData) ? contactsData : [])
        setOpportunities(Array.isArray(oppsData) ? oppsData : [])
        setFormData({
          title: task.title ?? '',
          description: task.description ?? '',
          dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
          priority: task.priority ?? 'MEDIUM',
          status: task.status ?? 'PENDING',
          contactId: task.contactId ?? '',
          opportunityId: task.opportunityId ?? '',
        })
      } catch {
        router.push('/tasks')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
          contactId: formData.contactId || null,
          opportunityId: formData.opportunityId || null,
        }),
      })
      if (res.ok) router.push('/tasks')
    } catch {
      console.error('Error updating task')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-12">Loading…</div>

  const inputCls = 'w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-fmea-accent text-sm'
  const labelCls = 'block text-sm font-medium text-slate-700 dark:text-fmea-text mb-1'

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-indigo-600 dark:text-fmea-accent hover:text-indigo-700 dark:hover:text-fmea-hi mb-6 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi mb-6">Edit Task</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white dark:bg-fmea-bg2 rounded-xl shadow-sm border border-slate-200 dark:border-fmea-border p-6 space-y-5">

        <div>
          <label className={labelCls}>Task Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={inputCls}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className={inputCls}
            >
              {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label as string}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className={inputCls}
          >
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Contact</label>
            <select
              value={formData.contactId}
              onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
              className={inputCls}
            >
              <option value="">None</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Opportunity</label>
            <select
              value={formData.opportunityId}
              onChange={(e) => setFormData({ ...formData, opportunityId: e.target.value })}
              className={inputCls}
            >
              <option value="">None</option>
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>{o.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 dark:bg-fmea-accent text-white dark:text-fmea-bg text-sm font-medium hover:bg-indigo-700 dark:hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-700 dark:text-fmea-dim text-sm font-medium hover:bg-slate-200 dark:hover:bg-fmea-border transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
