'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { WorkSessionView, WorkYearData } from '@/lib/work-sessions'

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function hoursLabel(hours: number) {
  return `${hours.toFixed(hours % 1 === 0 ? 1 : 2)} hours`
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00.000Z`))
}

function DayDetail({ sessions, shareSafe }: { sessions: WorkSessionView[]; shareSafe: boolean }) {
  const total = sessions.reduce((sum, row) => sum + row.hours, 0)
  if (!sessions.length) return <span>No hours recorded</span>
  return (
    <span>
      <strong className="font-semibold">{hoursLabel(total)} recorded</strong>
      {!shareSafe && (
        <span className="mt-1 block text-slate-500 dark:text-fmea-dim">
          {sessions.map((row) => [row.projectLabel, row.activity].filter(Boolean).join(' · ')).filter(Boolean).join(' / ') || 'No project description recorded'}
        </span>
      )}
    </span>
  )
}

export function WorkYearMap({ data, shareSafe = false }: { data: WorkYearData; shareSafe?: boolean }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const sessionsByDate = useMemo(() => {
    const grouped = new Map<string, WorkSessionView[]>()
    for (const session of data.sessions) {
      grouped.set(session.workDate, [...(grouped.get(session.workDate) ?? []), session])
    }
    return grouped
  }, [data.sessions])
  const selectedSessions = selectedDate ? sessionsByDate.get(selectedDate) ?? [] : []
  const monthNames = useMemo(() => new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' }), [])

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 border-b border-stone-100 pb-5 dark:border-fmea-border sm:flex sm:gap-8">
        <div><p className="text-2xl font-semibold tabular-nums text-slate-950 dark:text-fmea-hi">{data.totalHours.toFixed(1)}</p><p className="text-xs text-slate-400 dark:text-fmea-dim">hours</p></div>
        <div><p className="text-2xl font-semibold tabular-nums text-slate-950 dark:text-fmea-hi">{data.workDays}</p><p className="text-xs text-slate-400 dark:text-fmea-dim">work days</p></div>
        <div><p className="text-2xl font-semibold tabular-nums text-slate-950 dark:text-fmea-hi">{data.averageHoursPerDay.toFixed(1)}</p><p className="text-xs text-slate-400 dark:text-fmea-dim">hours per day</p></div>
      </div>

      <div className="mt-6 grid gap-x-5 gap-y-7 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }, (_, month) => {
          const first = new Date(Date.UTC(data.year, month, 1, 12))
          const leadingBlanks = (first.getUTCDay() + 6) % 7
          const daysInMonth = new Date(Date.UTC(data.year, month + 1, 0, 12)).getUTCDate()
          const monthHours = data.sessions
            .filter((session) => Number(session.workDate.slice(5, 7)) === month + 1)
            .reduce((total, session) => total + session.hours, 0)
          return (
            <section key={month} className="break-inside-avoid" aria-label={monthNames.format(first)}>
              <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-slate-800 dark:text-fmea-text">{monthNames.format(first)}</h3>{monthHours > 0 && <span className="text-[10px] font-semibold tabular-nums text-cyan-700 dark:text-fmea-accent">{hoursLabel(monthHours)}</span>}</div>
              <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[9px] font-semibold text-slate-300 dark:text-fmea-border" aria-hidden="true">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: leadingBlanks }, (_, index) => <span key={`blank-${index}`} className="aspect-square" aria-hidden="true" />)}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1
                  const key = isoDate(data.year, month, day)
                  const rows = sessionsByDate.get(key) ?? []
                  const hours = rows.reduce((sum, row) => sum + row.hours, 0)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDate(key)}
                      aria-label={`${dateLabel(key)}: ${hours ? hoursLabel(hours) : 'no hours recorded'}`}
                      aria-pressed={selectedDate === key}
                      className={cn(
                        'aspect-square rounded-md text-[10px] tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-1 print:rounded-sm',
                        hours >= 8
                          ? 'bg-cyan-700 font-semibold text-white dark:bg-fmea-accent dark:text-fmea-bg'
                          : hours > 0
                            ? 'bg-cyan-200 font-semibold text-cyan-950 dark:bg-cyan-900 dark:text-cyan-100'
                            : 'bg-stone-100 text-stone-400 dark:bg-fmea-bg3 dark:text-fmea-dim',
                        selectedDate === key && 'ring-2 ring-cyan-600 ring-offset-1'
                      )}
                    >
                      <span className="block leading-none">{day}</span>
                      {hours > 0 && <span className="mt-0.5 block text-[9px] leading-none">{hours.toFixed(hours % 1 === 0 ? 0 : 1)}h</span>}
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-stone-100 pt-4 text-xs text-slate-500 dark:border-fmea-border dark:text-fmea-dim">
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-cyan-200 dark:bg-cyan-900" />Hours recorded</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-stone-100 dark:bg-fmea-bg3" />No hours recorded</span>
      </div>

      {!shareSafe && (
        <p className="mt-4 min-h-10 rounded-xl bg-stone-50 px-4 py-3 text-xs text-slate-600 dark:bg-fmea-bg3 dark:text-fmea-text" aria-live="polite">
          {selectedDate ? <><span className="font-semibold">{dateLabel(selectedDate)}</span><span className="mx-2 text-stone-300">·</span><DayDetail sessions={selectedSessions} shareSafe={shareSafe} /></> : 'Select a date to see its recorded hours and work description.'}
        </p>
      )}
    </div>
  )
}
