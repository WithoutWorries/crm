'use client'

import { OpportunityStage } from '@prisma/client'

interface PipelineItem {
  stage: OpportunityStage
  count: number
  value: number
}

interface PipelineSummaryProps {
  data: PipelineItem[]
}

const STAGE_CONFIG: Record<string, { label: string; bar: string; dot: string }> = {
  NEW_LEAD:               { label: 'New Lead',             bar: 'bg-slate-400',   dot: 'bg-slate-400' },
  INITIAL_CONTACT:        { label: 'Initial Contact',      bar: 'bg-blue-500',    dot: 'bg-blue-500' },
  TECHNICAL_DISCUSSION:   { label: 'Technical Discussion', bar: 'bg-indigo-500',  dot: 'bg-indigo-500' },
  PROBLEM_DEFINED:        { label: 'Problem Defined',      bar: 'bg-violet-500',  dot: 'bg-violet-500' },
  PROPOSAL_SENT:          { label: 'Proposal Sent',        bar: 'bg-amber-500',   dot: 'bg-amber-500' },
  NEGOTIATION:            { label: 'Negotiation',          bar: 'bg-orange-500',  dot: 'bg-orange-500' },
  WON:                    { label: 'Won',                  bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  LOST:                   { label: 'Lost',                 bar: 'bg-rose-400',    dot: 'bg-rose-400' },
}

export function PipelineSummary({ data }: PipelineSummaryProps) {
  const activeStages = data.filter((d) => !['WON', 'LOST'].includes(d.stage) && d.count > 0)
  const wonItem = data.find((d) => d.stage === 'WON')
  const lostItem = data.find((d) => d.stage === 'LOST')

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const totalActive = activeStages.reduce((s, d) => s + d.count, 0)
  const totalValue = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-slate-900 dark:text-fmea-hi">Pipeline Breakdown</h3>
        <div className="flex gap-4 text-xs text-slate-500 dark:text-fmea-dim">
          <span><span className="font-semibold text-slate-700 dark:text-fmea-text">{totalActive}</span> active</span>
          <span><span className="font-semibold text-slate-700 dark:text-fmea-text">£{totalValue.toLocaleString()}</span> weighted</span>
        </div>
      </div>

      {/* Active stage bars */}
      <div className="space-y-3 mb-5">
        {data.filter((d) => !['WON', 'LOST'].includes(d.stage)).map((item) => {
          const cfg = STAGE_CONFIG[item.stage]
          const pct = item.count > 0 ? Math.max((item.count / maxCount) * 100, 4) : 0
          return (
            <div key={item.stage} className="flex items-center gap-3">
              <div className="w-36 flex-shrink-0">
                <span className="text-xs text-slate-600 dark:text-fmea-dim">{cfg?.label ?? item.stage}</span>
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-fmea-bg3 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${cfg?.bar ?? 'bg-slate-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center gap-3 w-28 flex-shrink-0 justify-end">
                <span className="text-xs font-semibold text-slate-700 dark:text-fmea-text w-6 text-right">{item.count}</span>
                <span className="text-xs text-slate-500 dark:text-fmea-dim w-20 text-right">
                  {item.value > 0 ? `£${item.value.toLocaleString()}` : '—'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Win / Loss row */}
      {((wonItem?.count ?? 0) > 0 || (lostItem?.count ?? 0) > 0) && (
        <div className="border-t border-slate-100 dark:border-fmea-border pt-4 flex gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-600 dark:text-fmea-dim">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{wonItem?.count ?? 0}</span> Won
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="text-xs text-slate-600 dark:text-fmea-dim">
              <span className="font-semibold text-rose-500 dark:text-rose-400">{lostItem?.count ?? 0}</span> Lost
            </span>
          </div>
          {(wonItem?.count ?? 0) + (lostItem?.count ?? 0) > 0 && (
            <div className="ml-auto text-xs text-slate-500 dark:text-fmea-dim">
              Win rate:{' '}
              <span className="font-semibold text-slate-700 dark:text-fmea-text">
                {Math.round(((wonItem?.count ?? 0) / ((wonItem?.count ?? 0) + (lostItem?.count ?? 0))) * 100)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
