import { prisma } from '@/lib/prisma'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { PipelineSummary } from '@/components/dashboard/pipeline-summary'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks'

const USER_ID = 'user_1'

export default async function DashboardPage() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const yearStart = new Date(now.getFullYear(), 0, 1)

  const [
    openOpps,
    wonOpps,
    oppsByStage,
    weightedPipeline,
    overdueTasks,
    followUpsNeeded,
    totalContacts,
    recentActivities,
    upcomingTasks,
  ] = await Promise.all([
    prisma.opportunity.count({
      where: { userId: USER_ID, stage: { notIn: ['WON', 'LOST'] } },
    }),
    prisma.opportunity.count({
      where: { userId: USER_ID, stage: 'WON', wonDate: { gte: yearStart } },
    }),
    prisma.opportunity.groupBy({
      by: ['stage'],
      where: { userId: USER_ID },
      _count: true,
      _sum: { estimatedValue: true },
    }),
    prisma.opportunity.findMany({
      where: { userId: USER_ID, stage: { notIn: ['WON', 'LOST'] } },
      select: { estimatedValue: true, probabilityPercent: true },
    }),
    prisma.task.count({
      where: {
        userId: USER_ID,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { lt: today },
      },
    }),
    prisma.contact.count({
      where: { userId: USER_ID, nextFollowUpDate: { lte: weekFromNow } },
    }),
    prisma.contact.count({ where: { userId: USER_ID } }),
    prisma.activity.findMany({
      where: { userId: USER_ID },
      include: { contact: true, opportunity: true },
      orderBy: { happenedAt: 'desc' },
      take: 6,
    }),
    prisma.task.findMany({
      where: {
        userId: USER_ID,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { lte: weekFromNow },
      },
      orderBy: { dueDate: 'asc' },
      take: 6,
    }),
  ])

  const weightedTotal = weightedPipeline.reduce((sum, opp) => {
    if (opp.estimatedValue && opp.probabilityPercent) {
      return sum + Number(opp.estimatedValue) * (opp.probabilityPercent / 100)
    }
    return sum
  }, 0)

  const pipelineByStage = oppsByStage.map((item) => ({
    stage: item.stage,
    count: item._count,
    value: item._sum.estimatedValue ? Math.round(Number(item._sum.estimatedValue)) : 0,
  }))

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">{greeting}, Fraser</h1>
        <p className="text-sm text-slate-500 dark:text-fmea-dim mt-0.5">
          {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <StatsCards
        openOpportunities={openOpps}
        weightedPipeline={Math.round(weightedTotal)}
        overdueTasks={overdueTasks}
        followUpsNeeded={followUpsNeeded}
        totalContacts={totalContacts}
        wonOpportunities={wonOpps}
      />

      {/* Pipeline + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <PipelineSummary data={pipelineByStage as any} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivities as any} />
        </div>
      </div>

      {/* Tasks */}
      <UpcomingTasks tasks={upcomingTasks} />
    </div>
  )
}
