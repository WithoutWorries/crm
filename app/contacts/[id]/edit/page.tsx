'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { INFLUENCE_LEVEL_LABELS, RELATIONSHIP_LABELS } from '@/lib/constants'
import { ArrowLeft } from 'lucide-react'

interface Company { id: string; name: string }

export default function EditContactPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fullName: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    jobTitle: '',
    department: '',
    influenceLevel: 'UNKNOWN',
    relationshipType: 'COLD',
    technicalFocus: '',
    notes: '',
    companyId: '',
    lastContactDate: '',
    nextFollowUpDate: '',
  })

  useEffect(() => {
    if (params.id) {
      fetchContact()
      fetchCompanies()
    }
  }, [params.id])

  const fetchContact = async () => {
    try {
      const res = await fetch(`/api/contacts/${params.id}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        linkedinUrl: data.linkedinUrl || '',
        jobTitle: data.jobTitle || '',
        department: data.department || '',
        influenceLevel: data.influenceLevel || 'UNKNOWN',
        relationshipType: data.relationshipType || 'COLD',
        technicalFocus: data.technicalFocus || '',
        notes: data.notes || '',
        companyId: data.companyId || '',
        lastContactDate: data.lastContactDate ? data.lastContactDate.slice(0, 10) : '',
        nextFollowUpDate: data.nextFollowUpDate ? data.nextFollowUpDate.slice(0, 10) : '',
      })
    } catch {
      router.push('/contacts')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies')
      const data = await res.json()
      setCompanies(data)
    } catch { /* ignore */ }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...formData,
        fullName: `${formData.firstName}${formData.lastName ? ' ' + formData.lastName : ''}`,
        lastContactDate: formData.lastContactDate || null,
        nextFollowUpDate: formData.nextFollowUpDate || null,
        companyId: formData.companyId || null,
      }
      const res = await fetch(`/api/contacts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) router.push(`/contacts/${params.id}`)
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-indigo-500"
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-fmea-dim mb-1"

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-indigo-600 dark:text-fmea-accent hover:opacity-80 mb-6">
        <ArrowLeft className="h-5 w-5" />
        Back
      </button>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-fmea-hi mb-8">Edit Contact</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white dark:bg-fmea-bg2 rounded-lg shadow-sm border border-slate-200 dark:border-fmea-border p-6 space-y-5">

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>First Name *</label>
            <input required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Last Name</label>
            <input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Company</label>
          <select value={formData.companyId} onChange={(e) => setFormData({ ...formData, companyId: e.target.value })} className={inputClass}>
            <option value="">No company</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Job Title</label>
            <input value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Department</label>
            <input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>LinkedIn URL</label>
          <input value={formData.linkedinUrl} onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Influence Level</label>
            <select value={formData.influenceLevel} onChange={(e) => setFormData({ ...formData, influenceLevel: e.target.value })} className={inputClass}>
              {Object.entries(INFLUENCE_LEVEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Relationship</label>
            <select value={formData.relationshipType} onChange={(e) => setFormData({ ...formData, relationshipType: e.target.value })} className={inputClass}>
              {Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Technical Focus</label>
          <input value={formData.technicalFocus} onChange={(e) => setFormData({ ...formData, technicalFocus: e.target.value })} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Last Contact Date</label>
            <input type="date" value={formData.lastContactDate} onChange={(e) => setFormData({ ...formData, lastContactDate: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Next Follow-up Date</label>
            <input type="date" value={formData.nextFollowUpDate} onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={4} className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text text-sm font-medium hover:bg-slate-200 dark:hover:bg-fmea-border transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
