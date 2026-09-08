import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { PrintButton } from '@/components/tax/print-button'
import { WorkYearMap } from '@/components/tax/work-year-map'
import { getSession } from '@/lib/session'
import { getWorkYearData } from '@/lib/work-sessions'

export const dynamic = 'force-dynamic'

export default async function WorkYearSharePage({
  params,
  searchParams,
}: {
  params: Promise<{ year: string }>
  searchParams: Promise<{ project?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { year: yearValue } = await params
  const year = Number(yearValue)
  if (!Number.isInteger(year) || year < 1990 || year > 2200) redirect('/tax')
  const query = await searchParams
  const project = query.project?.trim().slice(0, 160) || null
  const data = await getWorkYearData(session.userId, year, project)

  return (
    <div className="mx-auto max-w-5xl print:max-w-none">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/tax" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-800 hover:text-cyan-950 dark:text-fmea-accent"><ArrowLeft className="h-4 w-4" />Back to Tax Horizon</Link>
        <PrintButton />
      </div>
      <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-fmea-border dark:bg-fmea-bg2 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="mb-6 flex flex-col gap-3 border-b border-stone-200 pb-5 dark:border-fmea-border sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-fmea-accent">Work record</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-950 dark:text-fmea-hi">{project || 'Recorded work'} · {year}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-fmea-dim">Working dates and hours only. Financial, tax, banking and source-document details are excluded.</p>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-fmea-dim print:hidden"><ShieldCheck className="h-4 w-4" />Private until you save or share it</span>
        </header>
        <WorkYearMap data={data} shareSafe />
        <footer className="mt-8 border-t border-stone-200 pt-4 text-[10px] text-slate-400 dark:border-fmea-border dark:text-fmea-dim">
          Generated from confirmed work records in Reference. Check against the source remittance before relying on it contractually.
        </footer>
      </article>
    </div>
  )
}
