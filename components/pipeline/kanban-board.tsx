'use client'

import { OpportunityStage } from '@prisma/client'
import { STAGE_LABELS } from '@/lib/constants'
import { OpportunityCard } from './opportunity-card'
import { Plus } from 'lucide-react'

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

const STAGES: OpportunityStage[] = [
  'NEW_LEAD',
  'INITIAL_CONTACT',
  'TECHNICAL_DISCUSSION',
  'PROBLEM_DEFINED',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'WON',
  'LOST',
]

export function KanbanBoard({ opportunities, onNewOpportunity }: KanbanBoardProps) {
  const oppsByStage = STAGES.reduce(
    (acc, stage) => {
      acc[stage] = opportunities.filter((opp) => opp.stage === stage)
      return acc
    },
    {} as Record<OpportunityStage, Opportunity[]>
  )

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {STAGES.map((stage) => {
          const stageOpps = oppsByStage[stage]
          return (
            <div
              key={stage}
              className="flex-shrink-0 w-96 bg-slate-50 dark:bg-fmea-bg2 rounded-lg border border-slate-200 dark:border-fmea-border"
            >
              {/* Column Header */}
              <div className="border-b border-slate-200 dark:border-fmea-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-fmea-text">
                    {STAGE_LABELS[stage]}
                  </h3>
                  <span className="text-xs font-medium text-slate-600 dark:text-fmea-dim bg-white dark:bg-fmea-bg3 px-2 py-1 rounded">
                    {stageOpps.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="p-4 space-y-3 min-h-96">
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

                {/* Add Button */}
                <button
                  onClick={() => onNewOpportunity(stage)}
                  className="w-full py-8 rounded-lg border-2 border-dashed border-slate-300 dark:border-fmea-border text-slate-600 dark:text-fmea-dim hover:text-slate-900 dark:hover:text-fmea-text hover:border-slate-400 dark:hover:border-fmea-border2 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-sm font-medium">Add opportunity</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
