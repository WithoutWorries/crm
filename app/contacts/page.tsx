'use client'

import { useEffect, useState } from 'react'
import { ContactsTable } from '@/components/contacts/contacts-table'
import { RELATIONSHIP_LABELS } from '@/lib/constants'
import { Search, Plus } from 'lucide-react'
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-fmea-hi">Contacts</h1>
          <p className="text-slate-600 dark:text-fmea-dim mt-1">Manage your professional network</p>
        </div>
        <Link
          href="/contacts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Contact
        </Link>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-fmea-dim" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={relationshipFilter}
          onChange={(e) => setRelationshipFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Relationships</option>
          {Object.entries(RELATIONSHIP_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <ContactsTable contacts={contacts} />
      )}
    </div>
  )
}
