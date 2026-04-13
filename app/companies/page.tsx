'use client'

import { useEffect, useState } from 'react'
import { CompanyList } from '@/components/companies/company-list'
import { Search, Plus } from 'lucide-react'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  industry?: string | null
  companyType?: string | null
  country?: string | null
  _count: {
    contacts: number
    opportunities: number
  }
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompanies()
  }, [search])

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`/api/companies?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      setCompanies(data)
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-fmea-hi">Companies</h1>
          <p className="text-slate-600 dark:text-fmea-dim mt-1">Manage all your company contacts</p>
        </div>
        <Link
          href="/companies/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Company
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-fmea-dim" />
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <CompanyList companies={companies} />
      )}
    </div>
  )
}
