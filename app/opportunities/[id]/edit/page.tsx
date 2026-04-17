'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  STAGE_LABELS, URGENCY_LABELS, INDUSTRY_LABELS,
  PROJECT_PHASE_LABELS, SERVICE_TYPE_LABELS, REGULATORY_FRAMEWORK_LABELS,
} from '@/lib/constants'
import { ArrowLeft, Calculator } from 'lucide-react'

interface Company { id: string; name: string }
interface Contact { id: string; fullName: string }

export default function EditOpportunityPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stage: 'NEW_LEAD',
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
    expectedCloseDate: '',
  })

  useEffect(() => {
    if (params.id) {
      fetchOpportunity()
      fetchCompaniesAndContacts()
    }
  }, [params.id])

  const fetchOpportunity = async () => {
    try {
      const res = await fetch(`/api/opportunities/${params.id}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setFormData({
        title: data.title || '',
        description: data.description || '',
        stage: data.stage || 'NEW_LEAD',
        companyId: data.companyId || '',
        primaryContactId: data.primaryContactId || '',
        industry: data.industry || '',
        systemType: data.systemType || '',
        projectPhase: data.projectPhase || 'UNKNOWN',
        regulatoryDrivers: data.regulatoryDrivers || [],
        services: data.services || [],
        estimatedValue: data.estimatedValue ? String(data.estimatedValue) : '',
        currency: data.currency || 'GBP',
        probabilityPercent: data.probabilityPercent ? String(data.probabilityPercent) : '',
        urgency: data.urgency || 'MEDIUM',
        source: data.source || '',
        painPoints: data.painPoints || '',
        competitor: data.competitor || '',
        nextAction: data.nextAction || '',
        expectedCloseDate: data.expectedCloseDate ? data.expectedCloseDate.slice(0, 10) : '',
      })
    } catch {
      router.push('/opportunities')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompaniesAndContacts = async () => {
    try {
      const [cr, ct] = await Promise.all([fetch('/api/companies'), fetch('/api/contacts')])
      setCompanies(await cr.json())
      setContacts(await ct.json())
    } catch { /* ignore */ }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/opportunities/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          companyId: formData.companyId || null,
          primaryContactId: formData.primaryContactId || null,
          estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : null,
          probabilityPercent: formData.probabilityPercent ? parseInt(formData.probabilityPercent) : null,
          expectedCloseDate: formData.expectedCloseDate || null,
        }),
      })
      if (res.ok) router.push(`/opportunities/${params.id}`)
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggle = (field: 'services' | 'regulatoryDrivers', key: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(key) ? prev[field].filter((v) => v !== key) : [...prev[field], key],
    }))
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-indigo-500"
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-fmea-dim mb-1"

  // Contract value calculator state
  const [calcOpen, setCalcOpen] = useState(false)
  const [calc, setCalc] = useState({ rate: '', hoursPerWeek: '', durationWeeks: '', durationMonths: '', mode: 'months' as 'weeks' | 'months' })

  const calcTotal = (() => {
    const rate = parseFloat(calc.rate)
    const hpw = parseFloat(calc.hoursPerWeek)
    if (!rate || !hpw) return null
    if (calc.mode === 'months') {
      const months = parseFloat(calc.durationMonths)
      if (!months) return null
      return Math.round(rate * hpw * (months * 52 / 12))
    } else {
      const weeks = parseFloat(calc.durationWeeks)
      if (!weeks) return null
      return Math.round(rate * hpw * weeks)
    }
  })()

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-indigo-600 dark:text-fmea-accent hover:opacity-80 mb-6">
        <ArrowLeft className="h-5 w-5" />
        Back
      </button>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-fmea-hi mb-8">Edit Opportunity</h1>

      <form onSubmit={handleSubmit} className="max-w-4xl bg-white dark:bg-fmea-bg2 rounded-lg shadow-sm border border-slate-200 dark:border-fmea-border p-6 space-y-6">

        <section>
          <h2 className="font-semibold text-slate-900 dark:text-fmea-text mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Title *</label>
              <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Company</label>
                <select value={formData.companyId} onChange={(e) => setFormData({ ...formData, companyId: e.target.value })} className={inputClass}>
                  <option value="">Select company</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Primary Contact</label>
                <select value={formData.primaryContactId} onChange={(e) => setFormData({ ...formData, primaryContactId: e.target.value })} className={inputClass}>
                  <option value="">Select contact</option>
                  {contacts.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 dark:text-fmea-text mb-4">Pipeline & Finance</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Stage</label>
              <select value={formData.stage} onChange={(e) => setFormData({ ...formData, stage: e.target.value })} className={inputClass}>
                {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Urgency</label>
              <select value={formData.urgency} onChange={(e) => setFormData({ ...formData, urgency: e.target.value })} className={inputClass}>
                {Object.entries(URGENCY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className={inputClass}>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Estimated Value</label>
              <input type="number" value={formData.estimatedValue} onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })} className={inputClass} />
              <button type="button" onClick={() => setCalcOpen((o) => !o)}
                className="mt-1.5 flex items-center gap-1 text-xs text-indigo-600 dark:text-fmea-accent hover:underline">
                <Calculator className="h-3 w-3" />
                {calcOpen ? 'Hide calculator' : 'Calculate from rate × hours'}
              </button>
              {calcOpen && (
                <div className="mt-3 p-4 rounded-lg bg-slate-50 dark:bg-fmea-bg3 border border-slate-200 dark:border-fmea-border space-y-3">
                  <p className="text-xs font-medium text-slate-600 dark:text-fmea-dim">Contract Value Calculator</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-fmea-dim mb-1">Hourly rate</label>
                      <input type="number" placeholder="e.g. 120" value={calc.rate}
                        onChange={(e) => setCalc({ ...calc, rate: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-sm dark:text-fmea-text focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-fmea-dim mb-1">Hours / week</label>
                      <input type="number" placeholder="e.g. 40" value={calc.hoursPerWeek}
                        onChange={(e) => setCalc({ ...calc, hoursPerWeek: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-sm dark:text-fmea-text focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button"
                      onClick={() => setCalc({ ...calc, mode: 'months' })}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${calc.mode === 'months' ? 'bg-indigo-600 dark:bg-fmea-accent text-white dark:text-fmea-bg' : 'bg-slate-200 dark:bg-fmea-bg2 text-slate-600 dark:text-fmea-dim'}`}>
                      Months
                    </button>
                    <button type="button"
                      onClick={() => setCalc({ ...calc, mode: 'weeks' })}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${calc.mode === 'weeks' ? 'bg-indigo-600 dark:bg-fmea-accent text-white dark:text-fmea-bg' : 'bg-slate-200 dark:bg-fmea-bg2 text-slate-600 dark:text-fmea-dim'}`}>
                      Weeks
                    </button>
                    {calc.mode === 'months' ? (
                      <input type="number" placeholder="Duration (months)" value={calc.durationMonths}
                        onChange={(e) => setCalc({ ...calc, durationMonths: e.target.value })}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-sm dark:text-fmea-text focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                    ) : (
                      <input type="number" placeholder="Duration (weeks)" value={calc.durationWeeks}
                        onChange={(e) => setCalc({ ...calc, durationWeeks: e.target.value })}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-sm dark:text-fmea-text focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                    )}
                  </div>
                  {calcTotal !== null && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-semibold text-slate-900 dark:text-fmea-hi">
                        Total: {new Intl.NumberFormat('en-EU', { style: 'currency', currency: formData.currency || 'EUR', maximumFractionDigits: 0 }).format(calcTotal)}
                      </span>
                      <button type="button"
                        onClick={() => { setFormData({ ...formData, estimatedValue: String(calcTotal) }); setCalcOpen(false) }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 dark:bg-fmea-accent text-white dark:text-fmea-bg text-xs font-medium hover:bg-indigo-700 dark:hover:opacity-90 transition-colors">
                        Apply to value
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}>Probability %</label>
              <input type="number" min="0" max="100" value={formData.probabilityPercent} onChange={(e) => setFormData({ ...formData, probabilityPercent: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Expected Close Date</label>
              <input type="date" value={formData.expectedCloseDate} onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })} className={inputClass} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 dark:text-fmea-text mb-4">Technical Details</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Industry</label>
                <select value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} className={inputClass}>
                  <option value="">Select industry</option>
                  {Object.entries(INDUSTRY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Project Phase</label>
                <select value={formData.projectPhase} onChange={(e) => setFormData({ ...formData, projectPhase: e.target.value })} className={inputClass}>
                  {Object.entries(PROJECT_PHASE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>System Type</label>
              <input value={formData.systemType} onChange={(e) => setFormData({ ...formData, systemType: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Services Offered</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-2 text-sm text-slate-700 dark:text-fmea-text">
                    <input type="checkbox" checked={formData.services.includes(k)} onChange={() => toggle('services', k)} className="rounded" />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Regulatory Drivers</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {Object.entries(REGULATORY_FRAMEWORK_LABELS).slice(0, 12).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-2 text-sm text-slate-700 dark:text-fmea-text">
                    <input type="checkbox" checked={formData.regulatoryDrivers.includes(k)} onChange={() => toggle('regulatoryDrivers', k)} className="rounded" />
                    {v}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 dark:text-fmea-text mb-4">Additional Information</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Pain Points</label>
              <textarea value={formData.painPoints} onChange={(e) => setFormData({ ...formData, painPoints: e.target.value })} rows={3} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Competitor</label>
                <input value={formData.competitor} onChange={(e) => setFormData({ ...formData, competitor: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Source</label>
                <input value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Next Action</label>
              <input value={formData.nextAction} onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })} className={inputClass} />
            </div>
          </div>
        </section>

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
