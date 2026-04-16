'use client'

import { useEffect, useState } from 'react'
import { RELATIONSHIP_LABELS, RELATIONSHIP_COLORS } from '@/lib/constants'
import { Badge } from '@/components/shared/badge'
import { formatRelativeDate, isOverdue } from '@/lib/utils'
import { Search, Plus, Users, UserCheck, AlertCircle, Clock } from 'lucide-react'
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

const RELATIONSHIP_LEFT: Record<string, string> = {
  COLD:           'border-l-slate-300',
  WARM:           'border-l-orange-400',
  REFERRAL:       'border-l-blue-400',
  PAST_CLIENT:    'border-l-violet-400',
  CURRENT_CLIENT: 'border-l-emerald-500',
  PARTNER:        'border-l-indigo-500',
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [relationshipFilter, setRelationshipFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [search, relationshipFilter])

  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (relationshipFilter) params.append('relationshipType', relationshipFilter)
      const res = await fetch(`/api/contacts?${params.toString()}`)
      const data = await res.json()
      setContacts(data)
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentClients = contacts.filter((c) => c.relationshipType === 'CURRENT_CLIENT').length
  const overdueFollowUps = contacts.filter((c) => c.nextFollowUpDate && isOverdue(c.nextFollowUpDate)).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-600 text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">Contacts</h1>
            <p className="text-sm text-slate-500 dark:text-fmea-dim">Your professional network</p>
          </div>
        </div>
        <Link
          href="/contacts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Contact
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-violet-600 rounded-xl p-4 text-white">
          <p className="text-2xl font-bold">{contacts.length}</p>
          <p className="text-xs text-white/80 mt-0.5">Total Contacts</p>
        </div>
        <div className="bg-emerald-600 rounded-xl p-4 text-white">
          <UserCheck className="h-4 w-4 text-white/70 mb-1" />
          <p className="text-2xl font-bold">{currentClients}</p>
          <p className="text-xs text-white/80 mt-0.5">Current Clients</p>
        </div>
        <div className={`rounded-xl p-4 text-white ${overdueFollowUps > 0 ? 'bg-rose-600' : 'bg-slate-500'}`}>
          {overdueFollowUps > 0 && <AlertCircle className="h-4 w-4 text-white/70 mb-1" />}
          {overdueFollowUps === 0 && <Clock className="h-4 w-4 text-white/70 mb-1" />}
          <p className="text-2xl font-bold">{overdueFollowUps}</p>
          <p className="text-xs text-white/80 mt-0.5">Overdue Follow-ups</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-fmea-dim" />
          <input
            type="text"
            placeholder="Search contacts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-slate-900 dark:text-fmea-text text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={relationshipFilter}
          onChange={(e) => setRelationshipFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-slate-900 dark:text-fmea-text text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Relationships</option>
          {Object.entries(RELATIONSHIP_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-fmea-dim">No contacts found</div>
      ) : (
        <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-fmea-bg3 border-b border-slate-200 dark:border-fmea-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Job Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Relationship</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Last Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Next Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-fmea-border">
              {contacts.map((contact) => {
                const followUpOverdue = contact.nextFollowUpDate && isOverdue(contact.nextFollowUpDate)
                const leftBorder = RELATIONSHIP_LEFT[contact.relationshipType] ?? 'border-l-slate-200'
                return (
                  <tr
                    key={contact.id}
                    className={`border-l-4 ${leftBorder} hover:bg-slate-50 dark:hover:bg-fmea-bg3 transition-colors ${followUpOverdue ? 'bg-rose-50 dark:bg-rose-900/10' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/contacts/${contact.id}`} className="text-sm font-semibold text-indigo-600 dark:text-fmea-accent hover:underline">
                        {contact.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-fmea-dim">{contact.company?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-fmea-dim">{contact.jobTitle || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge label={RELATIONSHIP_LABELS[contact.relationshipType as any]} color={RELATIONSHIP_COLORS[contact.relationshipType as any]} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-fmea-dim">
                      {contact.lastContactDate ? formatRelativeDate(contact.lastContactDate) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={followUpOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-fmea-dim'}>
                        {contact.nextFollowUpDate ? formatRelativeDate(contact.nextFollowUpDate) : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
