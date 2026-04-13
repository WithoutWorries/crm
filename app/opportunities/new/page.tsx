'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  INDUSTRY_LABELS,
  PROJECT_PHASE_LABELS,
  SERVICE_TYPE_LABELS,
  REGULATORY_FRAMEWORK_LABELS,
  STAGE_LABELS,
  URGENCY_LABELS,
} from '@/lib/constants'
import { ArrowLeft } from 'lucide-react'

interface Company {
  id: string
  name: string
}

interface Contact {
  id: string
  fullName: string
}

export default function NewOpportunityPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stage: searchParams.get('stage') || 'NEW_LEAD',
    companyId: '',
    primaryContactId: '',
    industry: '',
    systemType: '',
    projectPhase: 'UNKNOWN',
    regulatoryDrivers: [] as string[],
    services: [] as string[],
    estimatedValue: '',
    currency: 'GBP',
    probabilityPercent: '',
    urgency: 'MEDIUM',
    source: '',
    painPoints: '',
    competitor: '',
    nextAction: '',
  })

  useEffect(() => {
    fetchCompaniesAndContacts()
  }, [])

  const fetchCompaniesAndContacts = async () => {
    try {
      const [companiesRes, contactsRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/contacts'),
      ])
      const companiesData = await companiesRes.json()
      const contactsData = await contactsRes.json()
      setCompanies(companiesData)
      setContacts(contactsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          companyId: formData.companyId || null,
          primaryContactId: formData.primaryContactId || null,
          estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : null,
          probabilityPercent: formData.probabilityPercent ? parseInt(formData.probabilityPercent) : null,
        }),
      })

      if (res.ok) {
        const opportunity = await res.json()
        router.push(`/opportunities/${opportunity.id}`)
      }
    } catch (error) {
      console.error('Error creating opportunity:', error)
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

      <h1 className="text-3xl font-bold text-slate-900 mb-8">New Opportunity</h1>

      <form onSubmit={handleSubmit} className="max-w-4xl bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="space-y-6">
          {/* Basic Info */}
          <section>
            <h2 className="font-semibold text-slate-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Opportunity Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    Company
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    Primary Contact
                  </label>
                  <select
                    value={formData.primaryContactId}
                    onChange={(e) => setFormData({ ...formData, primaryContactId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select contact</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Pipeline & Finance */}
          <section>
            <h2 className="font-semibold text-slate-900 mb-4">Pipeline & Finance</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    Stage
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(STAGE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    Urgency
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(URGENCY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    Estimated Value
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedValue}
                    onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    Probability %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probabilityPercent}
                    onChange={(e) => setFormData({ ...formData, probabilityPercent: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Technical */}
          <section>
            <h2 className="font-semibold text-slate-900 mb-4">Technical Details</h2>
            <div className="space-y-4">
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
                    Project Phase
                  </label>
                  <select
                    value={formData.projectPhase}
                    onChange={(e) => setFormData({ ...formData, projectPhase: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(PROJECT_PHASE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  System Type
                </label>
                <input
                  type="text"
                  value={formData.systemType}
                  onChange={(e) => setFormData({ ...formData, systemType: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Services Offered
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.services.includes(key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              services: [...formData.services, key],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              services: formData.services.filter((s) => s !== key),
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
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Regulatory Drivers
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {Object.entries(REGULATORY_FRAMEWORK_LABELS).slice(0, 12).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.regulatoryDrivers.includes(key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              regulatoryDrivers: [...formData.regulatoryDrivers, key],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              regulatoryDrivers: formData.regulatoryDrivers.filter(
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
            </div>
          </section>

          {/* Notes */}
          <section>
            <h2 className="font-semibold text-slate-900 mb-4">Additional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Pain Points
                </label>
                <textarea
                  value={formData.painPoints}
                  onChange={(e) => setFormData({ ...formData, painPoints: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    Competitor
                  </label>
                  <input
                    type="text"
                    value={formData.competitor}
                    onChange={(e) => setFormData({ ...formData, competitor: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Next Action
                </label>
                <input
                  type="text"
                  value={formData.nextAction}
                  onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Opportunity'}
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
