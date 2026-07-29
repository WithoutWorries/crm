export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { PipelineSummary } from '@/components/dashboard/pipeline-summary'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks'
import { WelcomeGuide } from '@/components/dashboard/welcome-guide'
import { Greeting } from '@/components/dashboard/greeting'
import { ProcurementSummary } from '@/components/dashboard/procurement-summary'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true },
  })
  const displayName = currentUser?.name?.split(' ')[0] ?? 'there'
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const workspaceRecord = { user: { workspaceId: session.workspaceId } }

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
    openProcurement,
  ] = await Promise.all([
    prisma.opportunity.count({
      where: { ...workspaceRecord, stage: { notIn: ['WON', 'LOST'] } },
    }),
    prisma.opportunity.count({
      where: { ...workspaceRecord, stage: 'WON', wonDate: { gte: yearStart } },
    }),
    prisma.opportunity.groupBy({
      by: ['stage'],
      where: workspaceRecord,
      _count: true,
      _sum: { estimatedValue: true },
    }),
    prisma.opportunity.aggregate({
      where: { ...workspaceRecord, stage: { notIn: ['WON', 'LOST'] } },
      _sum: { estimatedValue: true },
    }),
    prisma.task.count({
      where: {
        ...workspaceRecord,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { lt: today },
      },
    }),
    prisma.contact.count({
      where: { ...workspaceRecord, nextFollowUpDate: { lte: weekFromNow } },
    }),
    prisma.contact.count({ where: workspaceRecord }),
    prisma.activity.findMany({
      where: workspaceRecord,
      include: { contact: true, opportunity: true },
      orderBy: { happenedAt: 'desc' },
      take: 6,
    }),
    prisma.task.findMany({
      where: {
        ...workspaceRecord,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { lte: weekFromNow },
      },
      orderBy: { dueDate: 'asc' },
      take: 6,
    }),
    prisma.procurementProject.findMany({
          where: { userId: session.userId, status: 'OPEN' },
          orderBy: [{ decisionDeadline: 'asc' }, { createdAt: 'desc' }],
          take: 6,
          select: {
            id: true, title: true, category: true, decisionDeadline: true,
            quotes: { select: { status: true, feeAmount: true, feeCurrency: true } },
          },
        }),
  ])

  const pipelineTotal = Math.round(Number(pipelineValue._sum.estimatedValue ?? 0))

  const pipelineByStage = oppsByStage.map((item) => ({
    stage: item.stage,
    count: item._count,
    value: item._sum.estimatedValue ? Math.round(Number(item._sum.estimatedValue)) : 0,
  }))

  const dateString = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // Serialize Prisma Decimal → number for client component boundary
  const procurementProjects = openProcurement.map(p => ({
    ...p,
    decisionDeadline: p.decisionDeadline ? p.decisionDeadline.toISOString() : null,
    quotes: p.quotes.map(q => ({
      ...q,
      feeAmount: q.feeAmount ? Number(q.feeAmount) : null,
    })),
  }))

  return (
    <div className="space-y-6">
      <Greeting name={displayName} dateString={dateString} />

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

      <ProcurementSummary projects={procurementProjects} />

      <WelcomeGuide />
    </div>
  )
}
