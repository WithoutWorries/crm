'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { INFLUENCE_LEVEL_LABELS, INFLUENCE_LEVEL_COLORS, RELATIONSHIP_LABELS, RELATIONSHIP_COLORS } from '@/lib/constants'
import { Badge } from '@/components/shared/badge'
import { formatRelativeDate } from '@/lib/utils'
import { ArrowLeft, Edit2, Mail, Phone, LinkIcon, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { NotesSection } from '@/components/shared/notes-section'
import { ActivityTimeline } from '@/components/opportunities/activity-timeline'
import { useCurrentUser } from '@/hooks/use-current-user'

type Tab = 'overview' | 'activity' | 'notes'

interface Contact {
  id: string
  fullName: string
  email?: string | null
  phone?: string | null
  linkedinUrl?: string | null
  jobTitle?: string | null
  department?: string | null
  influenceLevel: string
  relationshipType: string
  technicalFocus?: string | null
  notes?: string | null
  lastContactDate?: Date | null
  nextFollowUpDate?: Date | null
  company?: { id: string; name: string } | null
  _count?: { opportunities: number; activities: number; tasks: number }
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

export default function ContactDetailPage() {
  const currentUser = useCurrentUser()
  const isAdmin = currentUser?.role === 'ADMIN'
  const params = useParams()
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [activities, setActivities] = useState<Activity[]>([])
  const [activitiesLoaded, setActivitiesLoaded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (params.id) fetchContact()
  }, [params.id])

  const fetchContact = async () => {
    try {
      const res = await fetch(`/api/contacts/${params.id}`)
      if (!res.ok) throw new Error('Contact not found')
      const data = await res.json()
      setContact(data)
    } catch (error) {
      console.error('Error fetching contact:', error)
      router.push('/contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = async (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'activity' && !activitiesLoaded) {
      try {
        const res = await fetch(`/api/activities?contactId=${params.id}`)
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
      await fetch(`/api/contacts/${params.id}`, { method: 'DELETE' })
      router.push('/contacts')
    } catch (error) {
      console.error('Error deleting contact:', error)
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (loading) return <div className="text-center py-12">Loading…</div>
  if (!contact) return <div className="text-center py-12">Contact not found</div>

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">{contact.fullName}</h1>
          {contact.jobTitle && <p className="text-sm text-slate-500 dark:text-fmea-dim mt-0.5">{contact.jobTitle}</p>}
          {contact.company && (
            <Link href={`/companies/${contact.company.id}`} className="text-sm text-indigo-600 dark:text-fmea-accent hover:underline mt-0.5 inline-block">
              {contact.company.name}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/contacts/${contact.id}/edit`}
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
              <span className="text-sm text-slate-600 dark:text-fmea-dim">Delete contact?</span>
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
            <div className="bg-white dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border p-6">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-fmea-text mb-4">Contact Information</h2>
              <div className="space-y-3">
                {contact.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-400 dark:text-fmea-dim flex-shrink-0" />
                    <a href={`mailto:${contact.email}`} className="text-sm text-indigo-600 dark:text-fmea-accent hover:underline">{contact.email}</a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-slate-400 dark:text-fmea-dim flex-shrink-0" />
                    <a href={`tel:${contact.phone}`} className="text-sm text-indigo-600 dark:text-fmea-accent hover:underline">{contact.phone}</a>
                  </div>
                )}
                {contact.linkedinUrl && (
                  <div className="flex items-center gap-3">
                    <LinkIcon className="h-4 w-4 text-slate-400 dark:text-fmea-dim flex-shrink-0" />
                    <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-fmea-accent hover:underline">LinkedIn Profile</a>
                  </div>
                )}
                {contact.department && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-fmea-dim mb-0.5">Department</p>
                    <p className="text-sm text-slate-800 dark:text-fmea-text">{contact.department}</p>
                  </div>
                )}
                {contact.technicalFocus && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-fmea-dim mb-0.5">Technical Focus</p>
                    <p className="text-sm text-slate-800 dark:text-fmea-text">{contact.technicalFocus}</p>
                  </div>
                )}
                {!contact.email && !contact.phone && !contact.linkedinUrl && !contact.department && !contact.technicalFocus && (
                  <p className="text-sm text-slate-400 dark:text-fmea-dim">No contact details recorded.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-fmea-text">Status</h3>
              <div>
                <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Influence Level</p>
                <Badge label={INFLUENCE_LEVEL_LABELS[contact.influenceLevel as any]} color={INFLUENCE_LEVEL_COLORS[contact.influenceLevel as any]} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-fmea-dim mb-1">Relationship</p>
                <Badge label={RELATIONSHIP_LABELS[contact.relationshipType as any]} color={RELATIONSHIP_COLORS[contact.relationshipType as any]} />
              </div>
            </div>
            <div className="bg-white dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-fmea-text">Timeline</h3>
              {contact.lastContactDate && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim">Last Contact</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-fmea-text">{formatRelativeDate(contact.lastContactDate)}</p>
                </div>
              )}
              {contact.nextFollowUpDate && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-fmea-dim">Next Follow-up</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-fmea-text">{formatRelativeDate(contact.nextFollowUpDate)}</p>
                </div>
              )}
              {!contact.lastContactDate && !contact.nextFollowUpDate && (
                <p className="text-sm text-slate-400 dark:text-fmea-dim">No dates recorded.</p>
              )}
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
      {activeTab === 'notes' && <NotesSection contactId={contact.id} />}
    </div>
  )
}
