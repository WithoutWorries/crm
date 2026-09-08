'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CalendarDays, ExternalLink, Loader2 } from 'lucide-react'
import { WorkYearMap } from '@/components/tax/work-year-map'
import type { WorkYearData } from '@/lib/work-sessions'

export function WorkYearSection({ reportingStartYear, refreshKey }: { reportingStartYear: number; refreshKey: string }) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [project, setProject] = useState('')
  const [data, setData] = useState<WorkYearData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({ year: String(year) })
        if (project) params.set('project', project)
        const response = await fetch(`/api/tax/work-sessions?${params}`, {
          cache: 'no-store', signal: controller.signal,
        })
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.error || 'Unable to load the work year')
        setData(result)
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Unable to load the work year')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [year, project, refreshKey])

  const years = Array.from(
    { length: Math.max(currentYear - reportingStartYear + 1, 1) },
    (_, index) => currentYear - index
  )
  const shareParams = new URLSearchParams()
  if (project) shareParams.set('project', project)
  const shareHref = `/tax/work-year/${year}${shareParams.size ? `?${shareParams}` : ''}`

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-fmea-border dark:bg-fmea-bg2 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-fmea-accent"><CalendarDays className="h-4 w-4" />Work record</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-fmea-hi">Year map</h2>
          <p className="mt-1 text-xs text-slate-400 dark:text-fmea-dim">Hours and working dates extracted from confirmed remittances.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-fmea-dim">Year
            <select value={year} onChange={(event) => { setYear(Number(event.target.value)); setProject('') }} className="ml-2 rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-sm text-slate-800 dark:border-fmea-border dark:bg-fmea-bg3 dark:text-fmea-text">
              {years.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          {!!data?.projectLabels.length && (
            <label className="text-xs font-semibold text-slate-500 dark:text-fmea-dim">Project
              <select value={project} onChange={(event) => setProject(event.target.value)} className="ml-2 max-w-52 rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-sm text-slate-800 dark:border-fmea-border dark:bg-fmea-bg3 dark:text-fmea-text">
                <option value="">All projects</option>
                {data.projectLabels.map((label) => <option key={label} value={label}>{label}</option>)}
              </select>
            </label>
          )}
          {!!data?.sessions.length && <Link href={shareHref} target="_blank" className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-cyan-500 dark:border-fmea-border dark:bg-fmea-bg3 dark:text-fmea-text">
            <ExternalLink className="h-3.5 w-3.5" />Share-safe view
          </Link>}
        </div>
      </div>

      <div className="mt-6">
        {loading && <div className="flex min-h-44 items-center justify-center text-sm text-slate-400"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading work record…</div>}
        {!loading && error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {!loading && !error && data && data.sessions.length > 0 && <WorkYearMap data={data} />}
        {!loading && !error && data && data.sessions.length === 0 && <div className="rounded-2xl border border-dashed border-stone-300 px-5 py-10 text-center dark:border-fmea-border"><CalendarDays className="mx-auto h-7 w-7 text-stone-300 dark:text-fmea-border" /><p className="mt-3 text-sm font-semibold text-slate-700 dark:text-fmea-text">No work dates recorded for {year}</p><p className="mt-1 text-xs text-slate-400 dark:text-fmea-dim">They will appear here after you review and save a remittance PDF.</p></div>}
      </div>
    </section>
  )
}
