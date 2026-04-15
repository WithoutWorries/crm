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
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { NotesSection } from '@/components/shared/notes-section'

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
  activities?: any[]
  tasks?: any[]
  notes?: any[]
  weightedValue?: number
}

export default function OpportunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  useEffect(() => {
    if (params.id) {
      fetchOpportunity()
    }
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

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!opportunity) {
    return <div className="text-center py-12">Opportunity not found</div>
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Back
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{opportunity.title}</h1>
          {opportunity.company && (
            <Link
              href={`/companies/${opportunity.company.id}`}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-1 inline-block"
            >
              {opportunity.company.name}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/opportunities/${opportunity.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Link>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Delete opportunity?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Stage</p>
          <Badge
            label={STAGE_LABELS[opportunity.stage as any]}
            color={STAGE_COLORS[opportunity.stage as any]}
          />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Urgency</p>
          <Badge
            label={URGENCY_LABELS[opportunity.urgency as any]}
            color={URGENCY_COLORS[opportunity.urgency as any]}
          />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Value</p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(opportunity.estimatedValue, opportunity.currency)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Probability</p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {opportunity.probabilityPercent}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Overview</h2>

            <div className="space-y-4">
              {opportunity.description && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Description</p>
                  <p className="text-sm text-slate-900 dark:text-slate-200">{opportunity.description}</p>
                </div>
              )}

              {opportunity.painPoints && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Pain Points</p>
                  <p className="text-sm text-slate-900 dark:text-slate-200">{opportunity.painPoints}</p>
                </div>
              )}

              {opportunity.nextAction && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Next Action</p>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">{opportunity.nextAction}</p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          {opportunity.activities && opportunity.activities.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Activity Timeline</h2>
              <ActivityTimeline activities={opportunity.activities} />
            </div>
          )}

          <NotesSection opportunityId={opportunity.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Details</h3>
            <div className="space-y-3">
              {opportunity.primaryContact && (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Primary Contact</p>
                  <Link
                    href={`/contacts/${opportunity.primaryContact.id}`}
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    {opportunity.primaryContact.fullName}
                  </Link>
                </div>
              )}

              {opportunity.industry && (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Industry</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {INDUSTRY_LABELS[opportunity.industry as any]}
                  </p>
                </div>
              )}

              {opportunity.projectPhase && (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Project Phase</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {PROJECT_PHASE_LABELS[opportunity.projectPhase as any]}
                  </p>
                </div>
              )}

              {opportunity.expectedCloseDate && (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Expected Close</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatDate(opportunity.expectedCloseDate)}
                  </p>
                </div>
              )}

              {opportunity.source && (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Source</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{opportunity.source}</p>
                </div>
              )}
            </div>
          </div>

          {/* Services & Regulatory */}
          {(opportunity.services?.length || 0) > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Services</h3>
              <div className="flex flex-wrap gap-2">
                {opportunity.services?.map((service) => (
                  <Badge
                    key={service}
                    label={SERVICE_TYPE_LABELS[service as any] || service}
                    color="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                  />
                ))}
              </div>
            </div>
          )}

          {(opportunity.regulatoryDrivers?.length || 0) > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Regulatory Drivers</h3>
              <div className="flex flex-wrap gap-2">
                {opportunity.regulatoryDrivers?.map((reg) => (
                  <Badge
                    key={reg}
                    label={REGULATORY_FRAMEWORK_LABELS[reg as any] || reg}
                    color="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                  />
                ))}
              </div>
            </div>
          )}

          {opportunity.competitor && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Competitor</h3>
              <p className="text-sm text-slate-900 dark:text-slate-200">{opportunity.competitor}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
