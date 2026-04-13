'use client'

import { RELATIONSHIP_LABELS, RELATIONSHIP_COLORS } from '@/lib/constants'
import { Badge } from '@/components/shared/badge'
import { formatRelativeDate, isOverdue } from '@/lib/utils'
import Link from 'next/link'

interface Contact {
  id: string
  fullName: string
  email?: string | null
  jobTitle?: string | null
  company?: { name: string } | null
  relationshipType: string
  lastContactDate?: Date | null
  nextFollowUpDate?: Date | null
}

interface ContactsTableProps {
  contacts: Contact[]
}

export function ContactsTable({ contacts }: ContactsTableProps) {
  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">No contacts found</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-fmea-bg2 rounded-lg shadow-sm border border-slate-200 dark:border-fmea-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-fmea-bg3 border-b border-slate-200 dark:border-fmea-border">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
              Name
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
              Company
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
              Job Title
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
              Relationship
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
              Last Contact
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
              Next Follow-up
            </th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact, idx) => {
            const isFollowUpOverdue = contact.nextFollowUpDate && isOverdue(contact.nextFollowUpDate)
            return (
              <tr
                key={contact.id}
                className={`border-b border-slate-200 dark:border-fmea-border hover:bg-slate-50 dark:hover:bg-fmea-bg3 transition-colors ${
                  idx === contacts.length - 1 ? 'border-0' : ''
                } ${isFollowUpOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="text-sm font-medium text-indigo-600 dark:text-fmea-accent hover:text-indigo-700 dark:hover:text-fmea-accent"
                  >
                    {contact.fullName}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-fmea-dim">
                  {contact.company?.name || '—'}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-fmea-dim">
                  {contact.jobTitle || '—'}
                </td>
                <td className="px-6 py-4">
                  <Badge
                    label={RELATIONSHIP_LABELS[contact.relationshipType as any]}
                    color={RELATIONSHIP_COLORS[contact.relationshipType as any]}
                  />
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-fmea-dim">
                  {contact.lastContactDate
                    ? formatRelativeDate(contact.lastContactDate)
                    : '—'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={isFollowUpOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-600 dark:text-fmea-dim'}>
                    {contact.nextFollowUpDate
                      ? formatRelativeDate(contact.nextFollowUpDate)
                      : '—'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
