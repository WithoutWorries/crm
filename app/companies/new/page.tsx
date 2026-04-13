'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { INDUSTRY_LABELS, COMPANY_TYPE_LABELS, REGULATORY_FRAMEWORK_LABELS } from '@/lib/constants'
import { ArrowLeft } from 'lucide-react'

export default function NewCompanyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const company = await res.json()
        router.push(`/companies/${company.id}`)
      }
    } catch (error) {
      console.error('Error creating company:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Back
      </button>

      <h1 className="text-3xl font-bold text-slate-900 mb-8">New Company</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select industry</option>
                {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Company Type
              </label>
              <select
                value={formData.companyType}
                onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select type</option>
                {Object.entries(COMPANY_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Regulatory Environment
            </label>
            <div className="space-y-2">
              {Object.entries(REGULATORY_FRAMEWORK_LABELS).slice(0, 10).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.regulatoryEnvironment.includes(key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          regulatoryEnvironment: [...formData.regulatoryEnvironment, key],
                        })
                      } else {
                        setFormData({
                          ...formData,
                          regulatoryEnvironment: formData.regulatoryEnvironment.filter(
                            (r) => r !== key
                          ),
                        })
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-900">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Company'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-900 text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
