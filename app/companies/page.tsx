'use client'

import { useEffect, useState } from 'react'
import { INDUSTRY_LABELS, COMPANY_TYPE_LABELS } from '@/lib/constants'
import { Search, Plus, Building2, Users, Target } from 'lucide-react'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  industry?: string | null
  companyType?: string | null
  country?: string | null
  _count: { contacts: number; opportunities: number }
}

const INDUSTRY_ACCENT: Record<string, string> = {
  AEROSPACE:       'border-l-blue-500',
  DEFENCE:         'border-l-slate-600',
  MARINE:          'border-l-cyan-500',
  MEDICAL_DEVICE:  'border-l-rose-500',
  PHARMACEUTICAL:  'border-l-pink-500',
  OIL_AND_GAS:     'border-l-amber-600',
  RENEWABLE_ENERGY:'border-l-emerald-500',
  RAIL:            'border-l-orange-500',
  AUTOMOTIVE:      'border-l-red-500',
  INDUSTRIAL:      'border-l-violet-500',
  OTHER:           'border-l-slate-400',
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

  const totalContacts = companies.reduce((s, c) => s + c._count.contacts, 0)
  const totalOpps = companies.reduce((s, c) => s + c._count.opportunities, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-600 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">Companies</h1>
            <p className="text-sm text-slate-500 dark:text-fmea-dim">Client and prospect organisations</p>
          </div>
        </div>
        <Link
          href="/companies/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Company
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-sky-600 rounded-xl p-4 text-white">
          <p className="text-2xl font-bold">{companies.length}</p>
          <p className="text-xs text-white/80 mt-0.5">Companies</p>
        </div>
        <div className="bg-violet-600 rounded-xl p-4 text-white">
          <Users className="h-4 w-4 text-white/70 mb-1" />
          <p className="text-2xl font-bold">{totalContacts}</p>
          <p className="text-xs text-white/80 mt-0.5">Total Contacts</p>
        </div>
        <div className="bg-indigo-600 rounded-xl p-4 text-white">
          <Target className="h-4 w-4 text-white/70 mb-1" />
          <p className="text-2xl font-bold">{totalOpps}</p>
          <p className="text-xs text-white/80 mt-0.5">Opportunities</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-fmea-dim" />
        <input
          type="text"
          placeholder="Search companies…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-slate-900 dark:text-fmea-text text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-fmea-dim">No companies found</div>
      ) : (
        <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-fmea-bg3 border-b border-slate-200 dark:border-fmea-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Industry</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Country</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Contacts</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Opps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-fmea-border">
              {companies.map((company) => {
                const leftBorder = company.industry ? (INDUSTRY_ACCENT[company.industry] ?? 'border-l-slate-300') : 'border-l-slate-200'
                return (
                  <tr key={company.id} className={`border-l-4 ${leftBorder} hover:bg-slate-50 dark:hover:bg-fmea-bg3 transition-colors`}>
                    <td className="px-4 py-3">
                      <Link href={`/companies/${company.id}`} className="text-sm font-semibold text-indigo-600 dark:text-fmea-accent hover:underline">
                        {company.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-fmea-dim">
                      {company.industry ? INDUSTRY_LABELS[company.industry as any] : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-fmea-dim">
                      {company.companyType ? COMPANY_TYPE_LABELS[company.companyType as any] : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-fmea-dim">{company.country || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-xs font-bold text-violet-700 dark:text-violet-300">
                        {company._count.contacts}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        {company._count.opportunities}
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
