export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifySessionToken, COOKIE_NAME } from '@/lib/session'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { PipelineSummary } from '@/components/dashboard/pipeline-summary'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks'
import { WelcomeGuide } from '@/components/dashboard/welcome-guide'

export default async function DashboardPage() {
  const token = cookies().get(COOKIE_NAME)?.value
  const session = token ? verifySessionToken(token) : null
  const currentUser = session
    ? await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } })
    : null
  const displayName = currentUser?.name?.split(' ')[0] ?? 'there'
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const yearStart = new Date(now.getFullYear(), 0, 1)

  const [
    openOpps,
    wonOpps,
    oppsByStage,
    pipelineValue,
    overdueTasks,
    followUpsNeeded,
    totalContacts,
    recentActivities,
    upcomingTasks,
  ] = await Promise.all([
    prisma.opportunity.count({ where: { stage: { notIn: ['WON', 'LOST'] } } }),
    prisma.opportunity.count({ where: { stage: 'WON', wonDate: { gte: yearStart } } }),
    prisma.opportunity.groupBy({
      by: ['stage'],
      _count: true,
      _sum: { estimatedValue: true },
    }),
    prisma.opportunity.aggregate({
      where: { stage: { notIn: ['WON', 'LOST'] } },
      _sum: { estimatedValue: true },
    }),
    prisma.task.count({
      where: { status: { notIn: ['COMPLETED', 'CANCELLED'] }, dueDate: { lt: today } },
    }),
    prisma.contact.count({ where: { nextFollowUpDate: { lte: weekFromNow } } }),
    prisma.contact.count(),
    prisma.activity.findMany({
      include: { contact: true, opportunity: true },
      orderBy: { happenedAt: 'desc' },
      take: 6,
    }),
    prisma.task.findMany({
      where: { status: { notIn: ['COMPLETED', 'CANCELLED'] }, dueDate: { lte: weekFromNow } },
      orderBy: { dueDate: 'asc' },
      take: 6,
    }),
  ])

  const pipelineTotal = Math.round(Number(pipelineValue._sum.estimatedValue ?? 0))

  const pipelineByStage = oppsByStage.map((item) => ({
    stage: item.stage,
    count: item._count,
    value: item._sum.estimatedValue ? Math.round(Number(item._sum.estimatedValue)) : 0,
  }))

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">{greeting}, {displayName}</h1>
        <p className="text-sm text-slate-500 dark:text-fmea-dim mt-0.5">
          {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {totalContacts === 0 && <WelcomeGuide />}

      <StatsCards
        openOpportunities={openOpps}
        pipelineValue={pipelineTotal}
        overdueTasks={overdueTasks}
        followUpsNeeded={followUpsNeeded}
        totalContacts={totalContacts}
        wonOpportunities={wonOpps}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <PipelineSummary data={pipelineByStage as any} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivities as any} />
        </div>
      </div>

      <UpcomingTasks tasks={upcomingTasks} />
    </div>
  )
}
