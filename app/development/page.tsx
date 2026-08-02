import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  Clock3,
  Database,
  FileText,
  FolderKanban,
  HardDriveDownload,
  Milestone,
  RefreshCw,
  Rocket,
  SearchCheck,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react'
import {
  PROGRESS_ENTRIES,
  ROADMAP_STAGES,
  ROADMAP_UPDATED_AT,
  STAGE_ZERO_REMAINING_TASKS,
  type RoadmapStatus,
} from '@/lib/development-roadmap'
import { AccessBoundaryMap } from '@/components/development/access-boundary-map'

const STAGE_ICONS: LucideIcon[] = [
  ShieldCheck,
  FolderKanban,
  Database,
  SearchCheck,
  FileText,
  Workflow,
  RefreshCw,
  Users,
]

const STATUS_STYLE: Record<
  RoadmapStatus,
  { label: string; icon: LucideIcon; badge: string; dot: string }
> = {
  COMPLETE: {
    label: 'Complete',
    icon: Check,
    badge:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  IN_PROGRESS: {
    label: 'Active',
    icon: Clock3,
    badge:
      'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/70 dark:bg-cyan-950/30 dark:text-cyan-300',
    dot: 'bg-cyan-600 shadow-[0_0_0_5px_rgba(8,145,178,0.14)]',
  },
  PLANNED: {
    label: 'Queued',
    icon: Circle,
    badge:
      'border-stone-200 bg-stone-50 text-stone-500 dark:border-fmea-border dark:bg-fmea-bg3 dark:text-fmea-dim',
    dot: 'bg-stone-300 dark:bg-fmea-border',
  },
}

export default function DevelopmentPage() {
  const activeStage = ROADMAP_STAGES.find((stage) => stage.status === 'IN_PROGRESS')
  const completed = ROADMAP_STAGES.filter((stage) => stage.status === 'COMPLETE').length
  const queued = ROADMAP_STAGES.filter((stage) => stage.status === 'PLANNED').length

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-fmea-accent">
              <Milestone className="h-4 w-4" />
              Development control
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-fmea-hi">
              Building the analysis system
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-fmea-dim">
              One controlled stage at a time, from a secure foundation to customer
              feedback in service.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm dark:border-fmea-border dark:bg-fmea-bg2 dark:text-fmea-dim">
            <RefreshCw className="h-3.5 w-3.5" />
            Updated {ROADMAP_UPDATED_AT}
          </div>
        </div>
      </header>

      <section className="mb-8 overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-stone-50 shadow-sm dark:border-cyan-950 dark:from-cyan-950/30 dark:via-fmea-bg2 dark:to-fmea-bg2">
        <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cyan-700 text-white shadow-lg shadow-cyan-700/20 dark:bg-fmea-accent dark:text-fmea-bg">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700 dark:text-fmea-accent">
                  Current focus · Stage {activeStage?.number ?? '—'}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-fmea-hi">
                  {activeStage?.title ?? 'Awaiting next stage'}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-fmea-dim">
                  {activeStage?.summary}
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/70 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <Check className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Built</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-fmea-hi">
                  Production live
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/70 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Rocket className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Next</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-fmea-hi">
                  Access boundary test
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/80 p-4 dark:border-fmea-border dark:bg-fmea-bg3">
                <div className="flex items-center gap-2 text-slate-500 dark:text-fmea-dim">
                  <HardDriveDownload className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Gate</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-fmea-hi">
                  Restore drill
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-cyan-100 bg-white/55 p-6 dark:border-cyan-950 dark:bg-fmea-bg3/40 lg:border-l lg:border-t-0 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-fmea-dim">
              Programme position
            </p>
            <div className="mt-5 flex items-end gap-3">
              <span className="pb-1 text-sm font-medium text-slate-500 dark:text-fmea-dim">
                Stage
              </span>
              <span className="text-5xl font-semibold tracking-tight text-slate-950 dark:text-fmea-hi">
                {activeStage?.number ?? '—'}
              </span>
              <span className="pb-1 text-sm text-slate-500 dark:text-fmea-dim">
                of {ROADMAP_STAGES.at(-1)?.number ?? '—'} · currently active
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400 dark:text-fmea-dim">
              Eight stages in total, numbered 0–7.
            </p>
            <div className="mt-5 grid grid-cols-8 gap-1.5" aria-label="Programme progress">
              {ROADMAP_STAGES.map((stage) => (
                <div
                  key={stage.number}
                  title={`Stage ${stage.number}: ${stage.title}`}
                  className={`h-2 rounded-full ${
                    stage.status === 'COMPLETE'
                      ? 'bg-emerald-500'
                      : stage.status === 'IN_PROGRESS'
                        ? 'bg-cyan-600'
                        : 'bg-stone-200 dark:bg-fmea-border'
                  }`}
                />
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                {completed} complete
              </span>
              <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
                {activeStage ? 1 : 0} active
              </span>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500 dark:bg-fmea-bg3 dark:text-fmea-dim">
                {queued} queued
              </span>
            </div>
          </div>
        </div>
      </section>

      <AccessBoundaryMap />

      <section className="mb-10 rounded-3xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/15 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
              Stage 0 closeout
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-fmea-hi">
              {STAGE_ZERO_REMAINING_TASKS.length} tasks remain
            </h2>
          </div>
          <p className="max-w-lg text-xs leading-5 text-slate-500 dark:text-fmea-dim">
            Stage 1 does not begin until these operational checks are evidenced and accepted.
          </p>
        </div>

        <ol className="mt-6 grid gap-3 md:grid-cols-2">
          {STAGE_ZERO_REMAINING_TASKS.map((task, index) => (
            <li
              key={task.title}
              className={`rounded-2xl border bg-white p-4 dark:bg-fmea-bg2 ${
                task.next
                  ? 'border-amber-300 ring-2 ring-amber-100 dark:border-amber-700 dark:ring-amber-950/50'
                  : 'border-stone-200 dark:border-fmea-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    task.next
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-100 text-stone-500 dark:bg-fmea-bg3 dark:text-fmea-dim'
                  }`}
                >
                  {index + 1}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-fmea-hi">
                      {task.title}
                    </h3>
                    {task.next && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                        Next
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-fmea-dim">
                    {task.detail}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-fmea-accent">
              Programme map
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-fmea-hi">
              Foundation to in-service learning
            </h2>
          </div>
          <ArrowRight className="hidden h-5 w-5 text-stone-300 sm:block dark:text-fmea-border" />
        </div>

        <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          <div className="absolute left-8 right-8 top-8 hidden h-px bg-stone-200 xl:block dark:bg-fmea-border" />
          {ROADMAP_STAGES.map((stage) => {
            const StageIcon = STAGE_ICONS[stage.number]
            const status = STATUS_STYLE[stage.status]
            const StatusIcon = status.icon

            return (
              <div
                key={stage.number}
                className={`relative rounded-2xl border bg-white p-4 shadow-sm transition-transform hover:-translate-y-0.5 dark:bg-fmea-bg2 ${
                  stage.status === 'IN_PROGRESS'
                    ? 'border-cyan-300 ring-2 ring-cyan-100 dark:border-fmea-accent dark:ring-cyan-950'
                    : 'border-stone-200 dark:border-fmea-border'
                }`}
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      stage.status === 'IN_PROGRESS'
                        ? 'bg-cyan-700 text-white dark:bg-fmea-accent dark:text-fmea-bg'
                        : stage.status === 'COMPLETE'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-stone-100 text-stone-500 dark:bg-fmea-bg3 dark:text-fmea-dim'
                    }`}
                  >
                    <StageIcon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-stone-400 dark:text-fmea-dim">
                    {String(stage.number).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-4 min-h-10 text-sm font-semibold leading-5 text-slate-900 dark:text-fmea-hi">
                  {stage.title}
                </h3>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-fmea-dim">
                  <StatusIcon className="h-3.5 w-3.5" />
                  {status.label}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-fmea-accent">
              Stage detail
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-fmea-hi">
              Open only what you need
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROADMAP_STAGES.map((stage) => {
              const StageIcon = STAGE_ICONS[stage.number]
              const status = STATUS_STYLE[stage.status]
              const StatusIcon = status.icon

              return (
                <details
                  key={stage.number}
                  className="group rounded-2xl border border-stone-200 bg-white shadow-sm open:shadow-md dark:border-fmea-border dark:bg-fmea-bg2"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-slate-600 group-open:bg-cyan-700 group-open:text-white dark:bg-fmea-bg3 dark:text-fmea-dim dark:group-open:bg-fmea-accent dark:group-open:text-fmea-bg">
                      <StageIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-fmea-dim">
                        Stage {stage.number}
                      </p>
                      <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-fmea-hi">
                        {stage.title}
                      </h3>
                    </div>
                    <span
                      className={`hidden items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold sm:inline-flex ${status.badge}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                    <ChevronDown className="h-4 w-4 text-stone-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-stone-100 px-4 pb-5 pt-4 dark:border-fmea-border">
                    <p className="text-sm leading-6 text-slate-600 dark:text-fmea-dim">
                      {stage.summary}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {stage.outcomes.map((outcome) => (
                        <span
                          key={outcome}
                          className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs leading-5 text-slate-600 dark:border-fmea-border dark:bg-fmea-bg3 dark:text-slate-300"
                        >
                          {outcome}
                        </span>
                      ))}
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        </section>

        <aside>
          <div className="lg:sticky lg:top-24">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-fmea-accent">
                Movement
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-fmea-hi">
                Latest progress
              </h2>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 dark:border-fmea-border dark:bg-fmea-bg2">
              <ol>
                {PROGRESS_ENTRIES.map((entry, index) => (
                  <li
                    key={`${entry.date}-${entry.title}`}
                    className={`relative pl-7 ${
                      index < PROGRESS_ENTRIES.length - 1 ? 'pb-6' : ''
                    }`}
                  >
                    {index < PROGRESS_ENTRIES.length - 1 && (
                      <span className="absolute left-[5px] top-4 h-full w-px bg-stone-300 dark:bg-fmea-border" />
                    )}
                    <span
                      className={`absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-stone-50 dark:border-fmea-bg2 ${
                        index === 0 ? 'bg-cyan-600' : 'bg-stone-300 dark:bg-fmea-border'
                      }`}
                    />
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-fmea-dim">
                        {entry.date}
                      </p>
                      {entry.stage !== null && (
                        <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                          S{entry.stage}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 text-sm font-semibold leading-5 text-slate-900 dark:text-fmea-hi">
                      {entry.title}
                    </h3>
                    <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-fmea-dim">
                      {entry.detail}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
