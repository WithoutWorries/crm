'use client'

import { useEffect, useState } from 'react'
import { STAGE_LABELS, STAGE_COLORS } from '@/lib/constants'
import { Badge } from '@/components/shared/badge'
import { formatCurrency } from '@/lib/utils'
import { Search, Plus } from 'lucide-react'
import Link from 'next/link'

interface Opportunity {
  id: string
  title: string
  stage: string
  company?: { name: string } | null
  estimatedValue?: number | null
  probabilityPercent?: number | null
  currency: string
  expectedCloseDate?: Date | null
  weightedValue?: number
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOpportunities()
  }, [search, stageFilter])

  const fetchOpportunities = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (stageFilter) params.append('stage', stageFilter)

      const res = await fetch(`/api/opportunities?${params.toString()}`)
      const data = await res.json()
      setOpportunities(data)
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-fmea-hi">Opportunities</h1>
          <p className="text-slate-600 dark:text-fmea-dim mt-1">Track your sales opportunities</p>
        </div>
        <Link
          href="/opportunities/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Opportunity
        </Link>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-fmea-dim" />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-slate-900 dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Stages</option>
          {Object.entries(STAGE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white dark:bg-fmea-bg2 rounded-lg shadow-sm border border-slate-200 dark:border-fmea-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-fmea-bg3 border-b border-slate-200 dark:border-fmea-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
                  Probability
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
                  Weighted Value
                </th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp, idx) => (
                <tr
                  key={opp.id}
                  className={`border-b border-slate-200 dark:border-fmea-border hover:bg-slate-50 dark:hover:bg-fmea-bg3 transition-colors ${
                    idx === opportunities.length - 1 ? 'border-0' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/opportunities/${opp.id}`}
                      className="text-sm font-medium text-indigo-600 dark:text-fmea-accent hover:text-indigo-700 dark:hover:text-fmea-accent"
                    >
                      {opp.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-fmea-dim">
                    {opp.company?.name || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      label={STAGE_LABELS[opp.stage as any]}
                      color={STAGE_COLORS[opp.stage as any]}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-fmea-text">
                    {formatCurrency(opp.estimatedValue, opp.currency)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-fmea-text">
                    {opp.probabilityPercent}%
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-indigo-600 dark:text-fmea-accent">
                    {formatCurrency(opp.weightedValue, opp.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
