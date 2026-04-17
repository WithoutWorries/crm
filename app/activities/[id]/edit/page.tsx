'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ACTIVITY_TYPE_LABELS } from '@/lib/constants'
import { ArrowLeft } from 'lucide-react'

interface Contact { id: string; fullName: string }
interface Opportunity { id: string; title: string }

export default function EditActivityPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [formData, setFormData] = useState({
    type: 'MEETING',
    subject: '',
    summary: '',
    details: '',
    nextStep: '',
    happenedAt: '',
    contactId: '',
    opportunityId: '',
  })

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [actRes, contactsRes, oppsRes] = await Promise.all([
          fetch(`/api/activities/${id}`),
          fetch('/api/contacts'),
          fetch('/api/opportunities'),
        ])
        if (!actRes.ok) { router.push('/activities'); return }
        const act = await actRes.json()
        const contactsData = await contactsRes.json()
        const oppsData = await oppsRes.json()

        setContacts(Array.isArray(contactsData) ? contactsData : [])
        setOpportunities(Array.isArray(oppsData) ? oppsData : [])
        setFormData({
          type: act.type ?? 'MEETING',
          subject: act.subject ?? '',
          summary: act.summary ?? '',
          details: act.details ?? '',
          nextStep: act.nextStep ?? '',
          happenedAt: act.happenedAt ? act.happenedAt.slice(0, 16) : '',
          contactId: act.contactId ?? '',
          opportunityId: act.opportunityId ?? '',
        })
      } catch {
        router.push('/activities')
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
      const res = await fetch(`/api/activities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          happenedAt: formData.happenedAt ? new Date(formData.happenedAt) : new Date(),
          contactId: formData.contactId || null,
          opportunityId: formData.opportunityId || null,
        }),
      })
      if (res.ok) router.push('/activities')
    } catch {
      console.error('Error updating activity')
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
        className="flex items-center gap-2 text-indigo-600 dark:text-fmea-accent hover:opacity-80 mb-6 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi mb-6">Edit Activity</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white dark:bg-fmea-bg2 rounded-xl shadow-sm border border-slate-200 dark:border-fmea-border p-6 space-y-5">

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Activity Type</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className={inputCls}>
              {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v as string}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Date &amp; Time</label>
            <input
              type="datetime-local"
              value={formData.happenedAt}
              onChange={(e) => setFormData({ ...formData, happenedAt: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Subject *</label>
          <input
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Summary</label>
          <textarea
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            rows={3}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Details</label>
          <textarea
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            rows={4}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Next Step</label>
          <input
            value={formData.nextStep}
            onChange={(e) => setFormData({ ...formData, nextStep: e.target.value })}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Contact</label>
            <select value={formData.contactId} onChange={(e) => setFormData({ ...formData, contactId: e.target.value })} className={inputCls}>
              <option value="">None</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Opportunity</label>
            <select value={formData.opportunityId} onChange={(e) => setFormData({ ...formData, opportunityId: e.target.value })} className={inputCls}>
              <option value="">None</option>
              {opportunities.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 dark:bg-fmea-accent text-white dark:text-fmea-bg text-sm font-medium hover:bg-indigo-700 dark:hover:opacity-90 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-700 dark:text-fmea-dim text-sm font-medium hover:bg-slate-200 dark:hover:bg-fmea-border transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
