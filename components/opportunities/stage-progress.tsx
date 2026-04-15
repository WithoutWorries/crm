'use client'

const PIPELINE_STAGES = [
  { key: 'NEW_LEAD', label: 'New Lead' },
  { key: 'INITIAL_CONTACT', label: 'Initial Contact' },
  { key: 'TECHNICAL_DISCUSSION', label: 'Technical' },
  { key: 'PROBLEM_DEFINED', label: 'Problem Defined' },
  { key: 'PROPOSAL_SENT', label: 'Proposal Sent' },
  { key: 'NEGOTIATION', label: 'Negotiation' },
]

interface StageProgressProps {
  currentStage: string
}

export function StageProgress({ currentStage }: StageProgressProps) {
  const isTerminal = currentStage === 'WON' || currentStage === 'LOST'
  const currentIndex = PIPELINE_STAGES.findIndex((s) => s.key === currentStage)

  return (
    <div className="mb-6">
      <div className="flex w-full rounded-lg overflow-hidden h-10">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isPast = !isTerminal && idx < currentIndex
          const isActive = !isTerminal && idx === currentIndex
          let bg = ''
          let text = ''
          if (isActive) {
            bg = 'bg-indigo-600 dark:bg-fmea-accent'
            text = 'text-white dark:text-fmea-bg font-semibold'
          } else if (isPast) {
            bg = 'bg-indigo-200 dark:bg-fmea-bg3'
            text = 'text-indigo-700 dark:text-fmea-dim'
          } else {
            bg = 'bg-slate-100 dark:bg-fmea-bg2'
            text = 'text-slate-400 dark:text-fmea-dim'
          }

          // Chevron clip-path: flat left on first, arrow-notch on rest; arrow-point on right for all except last
          const isFirst = idx === 0
          const isLast = idx === PIPELINE_STAGES.length - 1
          const clipPath = isFirst
            ? isLast
              ? 'none'
              : 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)'
            : isLast
            ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 10px 50%)'
            : 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)'

          return (
            <div
              key={stage.key}
              className={`flex-1 flex items-center justify-center text-xs ${bg} ${text} transition-colors`}
              style={{ clipPath, marginLeft: idx > 0 ? '-1px' : 0 }}
              title={stage.label}
            >
              <span className="px-1 truncate">{stage.label}</span>
            </div>
          )
        })}
      </div>

      {/* Terminal state banner */}
      {isTerminal && (
        <div
          className={`mt-2 flex items-center justify-center py-2 rounded-lg text-sm font-semibold ${
            currentStage === 'WON'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}
        >
          {currentStage === 'WON' ? '✓ Won' : '✕ Lost'}
        </div>
      )}
    </div>
  )
}
