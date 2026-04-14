'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { INDUSTRY_LABELS, COMPANY_TYPE_LABELS, REGULATORY_FRAMEWORK_LABELS } from '@/lib/constants'
import { ArrowLeft } from 'lucide-react'

export default function EditCompanyPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    country: '',
    city: '',
    industry: '',
    companyType: '',
    regulatoryEnvironment: [] as string[],
    notes: '',
  })

  useEffect(() => {
    if (params.id) fetchCompany()
  }, [params.id])

  const fetchCompany = async () => {
    try {
      const res = await fetch(`/api/companies/${params.id}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setFormData({
        name: data.name || '',
        website: data.website || '',
        country: data.country || '',
        city: data.city || '',
        industry: data.industry || '',
        companyType: data.companyType || '',
        regulatoryEnvironment: data.regulatoryEnvironment || [],
        notes: data.notes || '',
      })
    } catch {
      router.push('/companies')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/companies/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) router.push(`/companies/${params.id}`)
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleRegulatory = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      regulatoryEnvironment: prev.regulatoryEnvironment.includes(key)
        ? prev.regulatoryEnvironment.filter((r) => r !== key)
        : [...prev.regulatoryEnvironment, key],
    }))
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-indigo-600 dark:text-fmea-accent hover:opacity-80 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Back
      </button>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-fmea-hi mb-8">Edit Company</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white dark:bg-fmea-bg2 rounded-lg shadow-sm border border-slate-200 dark:border-fmea-border p-6 space-y-5">

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-fmea-dim mb-1">Company Name *</label>
          <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-fmea-dim mb-1">Website</label>
            <input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-fmea-dim mb-1">Country</label>
            <input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-fmea-dim mb-1">City</label>
            <input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-fmea-dim mb-1">Industry</label>
            <select value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select industry</option>
              {Object.entries(INDUSTRY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-fmea-dim mb-1">Company Type</label>
          <select value={formData.companyType} onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select type</option>
            {Object.entries(COMPANY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-fmea-dim mb-2">Regulatory Environment</label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {Object.entries(REGULATORY_FRAMEWORK_LABELS).slice(0, 12).map(([k, v]) => (
              <label key={k} className="flex items-center gap-2 text-sm text-slate-700 dark:text-fmea-text">
                <input type="checkbox" checked={formData.regulatoryEnvironment.includes(k)} onChange={() => toggleRegulatory(k)} className="rounded" />
                {v}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-fmea-dim mb-1">Notes</label>
          <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={4}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
