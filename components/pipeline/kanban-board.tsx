'use client'

import { OpportunityStage } from '@prisma/client'
import { OpportunityCard } from './opportunity-card'
import { Plus, Trophy, XCircle } from 'lucide-react'

interface Opportunity {
  id: string
  title: string
  stage: OpportunityStage
  company?: { name: string } | null
  estimatedValue?: number | null
  probabilityPercent?: number | null
}

interface KanbanBoardProps {
  opportunities: Opportunity[]
  onNewOpportunity: (stage: OpportunityStage) => void
}

const ACTIVE_STAGES: { stage: OpportunityStage; label: string; accent: string; header: string }[] = [
  { stage: 'NEW_LEAD',             label: 'New Lead',          accent: 'bg-slate-400',  header: 'border-t-slate-400' },
  { stage: 'INITIAL_CONTACT',      label: 'Initial Contact',   accent: 'bg-blue-500',   header: 'border-t-blue-500' },
  { stage: 'TECHNICAL_DISCUSSION', label: 'Technical',         accent: 'bg-indigo-500', header: 'border-t-indigo-500' },
  { stage: 'PROBLEM_DEFINED',      label: 'Problem Defined',   accent: 'bg-violet-500', header: 'border-t-violet-500' },
  { stage: 'PROPOSAL_SENT',        label: 'Proposal Sent',     accent: 'bg-amber-500',  header: 'border-t-amber-500' },
  { stage: 'NEGOTIATION',          label: 'Negotiation',       accent: 'bg-orange-500', header: 'border-t-orange-500' },
]

export function KanbanBoard({ opportunities, onNewOpportunity }: KanbanBoardProps) {
  const oppsByStage = (Object.fromEntries(
    [...ACTIVE_STAGES.map((s) => s.stage), 'WON' as OpportunityStage, 'LOST' as OpportunityStage].map((stage) => [
      stage,
      opportunities.filter((o) => o.stage === stage),
    ])
  )) as Record<OpportunityStage, Opportunity[]>

  const wonCount = oppsByStage['WON']?.length ?? 0
  const lostCount = oppsByStage['LOST']?.length ?? 0

  return (
    <div className="space-y-4">
      {/* Active pipeline — fills viewport width, no horizontal scroll */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {ACTIVE_STAGES.map(({ stage, label, header }) => {
          const stageOpps = oppsByStage[stage] ?? []
          return (
            <div
              key={stage}
              className={`flex flex-col rounded-xl border border-slate-200 dark:border-fmea-border bg-slate-50 dark:bg-fmea-bg2 border-t-4 ${header} min-w-0`}
            >
              {/* Column header */}
              <div className="px-3 pt-3 pb-2 border-b border-slate-200 dark:border-fmea-border flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-fmea-text truncate">{label}</span>
                <span className="text-xs font-bold text-slate-500 dark:text-fmea-dim bg-white dark:bg-fmea-bg3 rounded-full px-1.5 py-0.5 flex-shrink-0 ml-1">
                  {stageOpps.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 min-h-40">
                {stageOpps.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    id={opp.id}
                    title={opp.title}
                    companyName={opp.company?.name}
                    value={opp.estimatedValue}
                    probability={opp.probabilityPercent}
                    stage={stage}
                  />
                ))}
              </div>

              {/* Add button */}
              <button
                onClick={() => onNewOpportunity(stage)}
                className="mx-2 mb-2 py-2 rounded-lg border border-dashed border-slate-300 dark:border-fmea-border text-slate-400 dark:text-fmea-dim hover:text-slate-600 dark:hover:text-fmea-text hover:border-slate-400 transition-colors flex items-center justify-center gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          )
        })}
      </div>

      {/* Won / Lost summary strip */}
      {(wonCount > 0 || lostCount > 0) && (
        <div className="flex gap-3">
          {wonCount > 0 && (
            <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Won</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{wonCount}</p>
              </div>
              <div className="ml-auto space-y-1">
                {(oppsByStage['WON'] ?? []).slice(0, 3).map((opp) => (
                  <p key={opp.id} className="text-xs text-emerald-600 dark:text-emerald-400 truncate max-w-48">{opp.title}</p>
                ))}
                {wonCount > 3 && <p className="text-xs text-emerald-500">+{wonCount - 3} more</p>}
              </div>
            </div>
          )}
          {lostCount > 0 && (
            <div className="flex-1 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">Lost</p>
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{lostCount}</p>
              </div>
              <div className="ml-auto space-y-1">
                {(oppsByStage['LOST'] ?? []).slice(0, 3).map((opp) => (
                  <p key={opp.id} className="text-xs text-rose-500 dark:text-rose-400 truncate max-w-48">{opp.title}</p>
                ))}
                {lostCount > 3 && <p className="text-xs text-rose-400">+{lostCount - 3} more</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
