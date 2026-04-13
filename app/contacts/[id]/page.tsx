'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { INFLUENCE_LEVEL_LABELS, INFLUENCE_LEVEL_COLORS, RELATIONSHIP_LABELS, RELATIONSHIP_COLORS } from '@/lib/constants'
import { Badge } from '@/components/shared/badge'
import { formatRelativeDate } from '@/lib/utils'
import { ArrowLeft, Edit2, Mail, Phone, Linkedin } from 'lucide-react'
import Link from 'next/link'

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
  _count?: {
    opportunities: number
    activities: number
    tasks: number
  }
}

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchContact()
    }
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

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!contact) {
    return <div className="text-center py-12">Contact not found</div>
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{contact.fullName}</h1>
          {contact.jobTitle && <p className="text-slate-600 dark:text-slate-400 mt-1">{contact.jobTitle}</p>}
          {contact.company && (
            <Link
              href={`/companies/${contact.company.id}`}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-1 inline-block"
            >
              {contact.company.name}
            </Link>
          )}
        </div>
        <Link
          href={`/contacts/${contact.id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <Edit2 className="h-5 w-5" />
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Contact Information</h2>

            <div className="space-y-4">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-slate-400 dark:text-slate-600" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    {contact.email}
                  </a>
                </div>
              )}

              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-slate-400 dark:text-slate-600" />
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}

              {contact.linkedinUrl && (
                <div className="flex items-center gap-3">
                  <Linkedin className="h-5 w-5 text-slate-400 dark:text-slate-600" />
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}

              {contact.department && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Department</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{contact.department}</p>
                </div>
              )}

              {contact.technicalFocus && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Technical Focus</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{contact.technicalFocus}</p>
                </div>
              )}
            </div>
          </div>

          {contact.notes && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Notes</h3>
              <p className="text-sm text-slate-900 dark:text-slate-200">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Status</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Influence Level</p>
                <Badge
                  label={INFLUENCE_LEVEL_LABELS[contact.influenceLevel as any]}
                  color={INFLUENCE_LEVEL_COLORS[contact.influenceLevel as any]}
                />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Relationship</p>
                <Badge
                  label={RELATIONSHIP_LABELS[contact.relationshipType as any]}
                  color={RELATIONSHIP_COLORS[contact.relationshipType as any]}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Activity</h3>
            <div className="space-y-3">
              {contact.lastContactDate && (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Last Contact</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatRelativeDate(contact.lastContactDate)}
                  </p>
                </div>
              )}
              {contact.nextFollowUpDate && (
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Next Follow-up</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatRelativeDate(contact.nextFollowUpDate)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
