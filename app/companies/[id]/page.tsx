'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { INDUSTRY_LABELS, COMPANY_TYPE_LABELS, REGULATORY_FRAMEWORK_LABELS } from '@/lib/constants'
import { Badge } from '@/components/shared/badge'
import { ArrowLeft, Edit2, ExternalLink, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { NotesSection } from '@/components/shared/notes-section'
import { ActivityTimeline } from '@/components/opportunities/activity-timeline'
import { useCurrentUser } from '@/hooks/use-current-user'

type Tab = 'overview' | 'activity' | 'notes'

interface Company {
  id: string
  name: string
  website?: string | null
  country?: string | null
  city?: string | null
  industry?: string | null
  companyType?: string | null
  regulatoryEnvironment?: string[]
  notes?: string | null
  _count: { contacts: number; opportunities: number }
}

interface Activity {
  id: string
  type: string
  subject: string
  summary?: string | null
  details?: string | null
  nextStep?: string | null
  happenedAt: string
}

export default function CompanyDetailPage() {
  const currentUser = useCurrentUser()
  const isAdmin = currentUser?.role === 'ADMIN'
  const params = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [activities, setActivities] = useState<Activity[]>([])
  const [activitiesLoaded, setActivitiesLoaded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (params.id) fetchCompany()
  }, [params.id])

  const fetchCompany = async () => {
    try {
      const res = await fetch(`/api/companies/${params.id}`)
      if (!res.ok) throw new Error('Company not found')
      const data = await res.json()
      setCompany(data)
    } catch (error) {
      console.error('Error fetching company:', error)
      router.push('/companies')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = async (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'activity' && !activitiesLoaded) {
      try {
        const res = await fetch(`/api/activities?companyId=${params.id}`)
        if (res.ok) setActivities(await res.json())
      } catch (error) {
        console.error('Error fetching activities:', error)
      }
      setActivitiesLoaded(true)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetch(`/api/companies/${params.id}`, { method: 'DELETE' })
      router.push('/companies')
    } catch (error) {
      console.error('Error deleting company:', error)
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (loading) return <div className="text-center py-12">Loading…</div>
  if (!company) return <div className="text-center py-12">Company not found</div>

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'activity', label: `Activity${activitiesLoaded ? ` (${activities.length})` : ''}` },
    { key: 'notes', label: 'Notes' },
  ]

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-indigo-600 dark:text-fmea-accent hover:text-indigo-700 dark:hover:text-fmea-hi mb-4 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">{company.name}</h1>
          {(company.city || company.country) && (
            <p className="text-sm text-slate-500 dark:text-fmea-dim mt-0.5">
              {[company.city, company.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/companies/${company.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text text-sm font-medium hover:bg-slate-200 dark:hover:bg-fmea-bg2 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Link>
          {isAdmin && (!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-fmea-dim">Delete company?</span>
              <button onClick={handleDelete} disabled={deleting} className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-700 dark:text-fmea-dim text-sm font-medium hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-fmea-border mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 dark:border-fmea-accent text-indigo-600 dark:text-fmea-accent'
                  : 'border-transparent text-slate-500 dark:text-fmea-dim hover:text-slate-700 dark:hover:text-fmea-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border p-6 space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-fmea-text">Details</h2>
              {company.industry && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Industry</p>
                  <p className="text-sm text-slate-800 dark:text-fmea-text">{INDUSTRY_LABELS[company.industry as any]}</p>
                </div>
              )}
              {company.companyType && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Company Type</p>
                  <p className="text-sm text-slate-800 dark:text-fmea-text">{COMPANY_TYPE_LABELS[company.companyType as any]}</p>
                </div>
              )}
              {company.website && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Website</p>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-fmea-accent hover:underline"
                  >
                    {company.website}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
              {company.regulatoryEnvironment && company.regulatoryEnvironment.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mb-2">Regulatory Environment</p>
                  <div className="flex flex-wrap gap-2">
                    {company.regulatoryEnvironment.map((reg) => (
                      <Badge key={reg} label={REGULATORY_FRAMEWORK_LABELS[reg as any] || reg} color="bg-blue-100 dark:bg-fmea-bg3 text-blue-800 dark:text-fmea-accent" />
                    ))}
                  </div>
                </div>
              )}
              {!company.industry && !company.companyType && !company.website && !(company.regulatoryEnvironment?.length) && (
                <p className="text-sm text-slate-400 dark:text-fmea-dim">No details recorded.</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-fmea-text">Statistics</h3>
              <div>
                <p className="text-xs text-slate-500 dark:text-fmea-dim">Contacts</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">{company._count.contacts}</p>
              </div>
              <div className="border-t border-slate-100 dark:border-fmea-border pt-3">
                <p className="text-xs text-slate-500 dark:text-fmea-dim">Opportunities</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">{company._count.opportunities}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity tab */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border p-6">
          {!activitiesLoaded ? (
            <p className="text-sm text-slate-400 dark:text-fmea-dim">Loading activities…</p>
          ) : (
            <ActivityTimeline activities={activities as any} />
          )}
        </div>
      )}

      {/* Notes tab */}
      {activeTab === 'notes' && <NotesSection companyId={company.id} />}
    </div>
  )
}
