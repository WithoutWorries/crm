'use client'

import { useEffect, useState } from 'react'
import { STAGE_LABELS, STAGE_COLORS } from '@/lib/constants'
import { Badge } from '@/components/shared/badge'
import { formatCurrency } from '@/lib/utils'
import { Search, Plus, Target, TrendingUp, Trophy } from 'lucide-react'
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

const STAGE_LEFT: Record<string, string> = {
  NEW_LEAD:             'border-l-slate-400',
  INITIAL_CONTACT:      'border-l-blue-500',
  TECHNICAL_DISCUSSION: 'border-l-indigo-500',
  PROBLEM_DEFINED:      'border-l-violet-500',
  PROPOSAL_SENT:        'border-l-amber-500',
  NEGOTIATION:          'border-l-orange-500',
  WON:                  'border-l-emerald-500',
  LOST:                 'border-l-rose-400',
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

  const openOpps = opportunities.filter((o) => o.stage !== 'WON' && o.stage !== 'LOST')
  const wonOpps  = opportunities.filter((o) => o.stage === 'WON')
  const totalPipeline = openOpps.reduce((s, o) => s + (o.estimatedValue ? Number(o.estimatedValue) : 0), 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">Opportunities</h1>
            <p className="text-sm text-slate-500 dark:text-fmea-dim">Track your sales pipeline</p>
          </div>
        </div>
        <Link
          href="/opportunities/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Opportunity
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-600 rounded-xl p-4 text-white">
          <Target className="h-4 w-4 text-white/70 mb-1" />
          <p className="text-2xl font-bold">{openOpps.length}</p>
          <p className="text-xs text-white/80 mt-0.5">Open Opportunities</p>
        </div>
        <div className="bg-teal-600 rounded-xl p-4 text-white">
          <TrendingUp className="h-4 w-4 text-white/70 mb-1" />
          <p className="text-2xl font-bold">£{totalPipeline.toLocaleString()}</p>
          <p className="text-xs text-white/80 mt-0.5">Total Pipeline</p>
        </div>
        <div className="bg-emerald-600 rounded-xl p-4 text-white">
          <Trophy className="h-4 w-4 text-white/70 mb-1" />
          <p className="text-2xl font-bold">{wonOpps.length}</p>
          <p className="text-xs text-white/80 mt-0.5">Won</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-fmea-dim" />
          <input
            type="text"
            placeholder="Search opportunities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-slate-900 dark:text-fmea-text text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg2 text-slate-900 dark:text-fmea-text text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Stages</option>
          {Object.entries(STAGE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-fmea-dim">No opportunities found</div>
      ) : (
        <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-fmea-bg3 border-b border-slate-200 dark:border-fmea-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Value</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Prob.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Weighted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-fmea-border">
              {opportunities.map((opp) => {
                const leftBorder = STAGE_LEFT[opp.stage] ?? 'border-l-slate-200'
                return (
                  <tr
                    key={opp.id}
                    className={`border-l-4 ${leftBorder} hover:bg-slate-50 dark:hover:bg-fmea-bg3 transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/opportunities/${opp.id}`} className="text-sm font-semibold text-indigo-600 dark:text-fmea-accent hover:underline">
                        {opp.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-fmea-dim">
                      {opp.company?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={STAGE_LABELS[opp.stage as any]} color={STAGE_COLORS[opp.stage as any]} />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-fmea-text">
                      {formatCurrency(opp.estimatedValue, opp.currency)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {opp.probabilityPercent != null ? (
                        <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          {opp.probabilityPercent}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-indigo-600 dark:text-fmea-accent">
                      {formatCurrency(opp.weightedValue, opp.currency)}
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
