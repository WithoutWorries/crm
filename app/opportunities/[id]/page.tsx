'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  STAGE_LABELS,
  STAGE_COLORS,
  INDUSTRY_LABELS,
  PROJECT_PHASE_LABELS,
  SERVICE_TYPE_LABELS,
  REGULATORY_FRAMEWORK_LABELS,
  URGENCY_LABELS,
  URGENCY_COLORS,
} from '@/lib/constants'
import { Badge } from '@/components/shared/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ActivityTimeline } from '@/components/opportunities/activity-timeline'
import { StageProgress } from '@/components/opportunities/stage-progress'
import { NotesSection } from '@/components/shared/notes-section'
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'

type Tab = 'overview' | 'activity' | 'notes'

interface Activity {
  id: string
  type: string
  subject: string
  summary?: string | null
  details?: string | null
  nextStep?: string | null
  happenedAt: string
}

interface Opportunity {
  id: string
  title: string
  description?: string | null
  stage: string
  industry?: string | null
  systemType?: string | null
  projectPhase: string
  regulatoryDrivers?: string[]
  services?: string[]
  estimatedValue?: number | null
  currency: string
  probabilityPercent?: number | null
  urgency: string
  source?: string | null
  painPoints?: string | null
  competitor?: string | null
  expectedCloseDate?: Date | null
  nextAction?: string | null
  company?: { id: string; name: string } | null
  primaryContact?: { id: string; fullName: string } | null
  activities?: Activity[]
  createdAt: string
}

export default function OpportunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (params.id) fetchOpportunity()
  }, [params.id])

  const fetchOpportunity = async () => {
    try {
      const res = await fetch(`/api/opportunities/${params.id}`)
      if (!res.ok) throw new Error('Opportunity not found')
      const data = await res.json()
      setOpportunity(data)
    } catch (error) {
      console.error('Error fetching opportunity:', error)
      router.push('/opportunities')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetch(`/api/opportunities/${params.id}`, { method: 'DELETE' })
      router.push('/opportunities')
    } catch (error) {
      console.error('Error deleting opportunity:', error)
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const daysInFunnel = opportunity
    ? Math.floor((Date.now() - new Date(opportunity.createdAt).getTime()) / 86400000)
    : 0

  if (loading) return <div className="text-center py-12">Loading…</div>
  if (!opportunity) return <div className="text-center py-12">Opportunity not found</div>

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'activity', label: `Activity${opportunity.activities?.length ? ` (${opportunity.activities.length})` : ''}` },
    { key: 'notes', label: 'Notes' },
  ]

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-indigo-600 dark:text-fmea-accent hover:text-indigo-700 dark:hover:text-fmea-hi mb-4 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">{opportunity.title}</h1>
          {opportunity.company && (
            <Link
              href={`/companies/${opportunity.company.id}`}
              className="text-sm text-indigo-600 dark:text-fmea-accent hover:underline mt-0.5 inline-block"
            >
              {opportunity.company.name}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/opportunities/${opportunity.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-900 dark:text-fmea-text text-sm font-medium hover:bg-slate-200 dark:hover:bg-fmea-bg2 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Link>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-fmea-dim">Delete?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-700 dark:text-fmea-dim text-sm font-medium hover:bg-slate-200 dark:hover:bg-fmea-bg2 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stage progress bar */}
      <StageProgress currentStage={opportunity.stage} />

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border p-4">
          <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Days in funnel</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">{daysInFunnel}</p>
        </div>
        <div className="bg-white dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border p-4">
          <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Stage</p>
          <Badge
            label={STAGE_LABELS[opportunity.stage as any]}
            color={STAGE_COLORS[opportunity.stage as any]}
          />
        </div>
        <div className="bg-white dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border p-4">
          <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Value</p>
          <p className="text-lg font-bold text-slate-900 dark:text-fmea-hi">
            {formatCurrency(opportunity.estimatedValue, opportunity.currency)}
          </p>
        </div>
        <div className="bg-white dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border p-4">
          <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Probability</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">
            {opportunity.probabilityPercent ?? '—'}
            {opportunity.probabilityPercent != null && <span className="text-base font-normal">%</span>}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-fmea-border mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border p-6 space-y-4">
              {opportunity.description && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Description</p>
                  <p className="text-sm text-slate-800 dark:text-fmea-text">{opportunity.description}</p>
                </div>
              )}
              {opportunity.painPoints && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Pain Points</p>
                  <p className="text-sm text-slate-800 dark:text-fmea-text">{opportunity.painPoints}</p>
                </div>
              )}
              {opportunity.nextAction && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Next Action</p>
                  <p className="text-sm font-medium text-orange-600 dark:text-fmea-accent2">{opportunity.nextAction}</p>
                </div>
              )}
              {!opportunity.description && !opportunity.painPoints && !opportunity.nextAction && (
                <p className="text-sm text-slate-400 dark:text-fmea-dim">No overview details recorded.</p>
              )}
            </div>

            {/* Services & Regulatory */}
            {(opportunity.services?.length || 0) > 0 && (
              <div className="bg-white dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border p-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-fmea-text mb-3">Services</h3>
                <div className="flex flex-wrap gap-2">
                  {opportunity.services?.map((s) => (
                    <Badge key={s} label={SERVICE_TYPE_LABELS[s as any] || s} color="bg-blue-100 dark:bg-fmea-bg3 text-blue-800 dark:text-fmea-accent" />
                  ))}
                </div>
              </div>
            )}
            {(opportunity.regulatoryDrivers?.length || 0) > 0 && (
              <div className="bg-white dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border p-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-fmea-text mb-3">Regulatory Drivers</h3>
                <div className="flex flex-wrap gap-2">
                  {opportunity.regulatoryDrivers?.map((r) => (
                    <Badge key={r} label={REGULATORY_FRAMEWORK_LABELS[r as any] || r} color="bg-purple-100 dark:bg-fmea-bg3 text-purple-800 dark:text-fmea-dim" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-fmea-text">Details</h3>
              {opportunity.urgency && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Urgency</p>
                  <Badge label={URGENCY_LABELS[opportunity.urgency as any]} color={URGENCY_COLORS[opportunity.urgency as any]} />
                </div>
              )}
              {opportunity.primaryContact && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Primary Contact</p>
                  <Link href={`/contacts/${opportunity.primaryContact.id}`} className="text-sm font-medium text-indigo-600 dark:text-fmea-accent hover:underline">
                    {opportunity.primaryContact.fullName}
                  </Link>
                </div>
              )}
              {opportunity.industry && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Industry</p>
                  <p className="text-sm text-slate-800 dark:text-fmea-text">{INDUSTRY_LABELS[opportunity.industry as any]}</p>
                </div>
              )}
              {opportunity.projectPhase && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Project Phase</p>
                  <p className="text-sm text-slate-800 dark:text-fmea-text">{PROJECT_PHASE_LABELS[opportunity.projectPhase as any]}</p>
                </div>
              )}
              {opportunity.expectedCloseDate && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Expected Close</p>
                  <p className="text-sm text-slate-800 dark:text-fmea-text">{formatDate(opportunity.expectedCloseDate)}</p>
                </div>
              )}
              {opportunity.source && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Source</p>
                  <p className="text-sm text-slate-800 dark:text-fmea-text">{opportunity.source}</p>
                </div>
              )}
              {opportunity.competitor && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Competitor</p>
                  <p className="text-sm text-slate-800 dark:text-fmea-text">{opportunity.competitor}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border p-6">
          <ActivityTimeline activities={(opportunity.activities ?? []) as any} />
        </div>
      )}

      {activeTab === 'notes' && (
        <NotesSection opportunityId={opportunity.id} />
      )}
    </div>
  )
}
