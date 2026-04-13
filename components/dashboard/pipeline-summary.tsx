'use client'

import { STAGE_LABELS, STAGE_COLORS } from '@/lib/constants'
import { Badge } from '@/components/shared/badge'
import { OpportunityStage } from '@prisma/client'

interface PipelineItem {
  stage: OpportunityStage
  count: number
  value: number
}

interface PipelineSummaryProps {
  data: PipelineItem[]
}

export function PipelineSummary({ data }: PipelineSummaryProps) {
  return (
    <div className="bg-white dark:bg-fmea-bg2 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-fmea-border">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-fmea-text mb-4">Pipeline Breakdown</h3>

      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.stage} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge label={STAGE_LABELS[item.stage]} color={STAGE_COLORS[item.stage]} />
              <span className="text-sm text-slate-600 dark:text-fmea-dim">{item.count} opportunity</span>
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-fmea-text">£{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
