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

  // Get dashboard data
  const openOpps = await prisma.opportunity.count({
    where: {
      userId: USER_ID,
      stage: { notIn: ['WON', 'LOST'] },
    },
  })

  const oppsByStage = await prisma.opportunity.groupBy({
    by: ['stage'],
    where: { userId: USER_ID },
    _count: true,
    _sum: { estimatedValue: true },
  })

  const pipelineByStage = oppsByStage.map((item) => ({
    stage: item.stage,
    count: item._count,
    value: item._sum.estimatedValue ? Math.round(Number(item._sum.estimatedValue)) : 0,
  }))

  const weightedPipeline = await prisma.opportunity.findMany({
    where: { userId: USER_ID, stage: { notIn: ['WON', 'LOST'] } },
    select: { estimatedValue: true, probabilityPercent: true },
  })

  const weightedTotal = weightedPipeline.reduce((sum, opp) => {
    if (opp.estimatedValue && opp.probabilityPercent) {
      return sum + Number(opp.estimatedValue) * (opp.probabilityPercent / 100)
    }
    return sum
  }, 0)

  const overdueTasks = await prisma.task.count({
    where: {
      userId: USER_ID,
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
      dueDate: { lt: today },
    },
  })

  const followUpsNeeded = await prisma.contact.count({
    where: {
      userId: USER_ID,
      nextFollowUpDate: { lte: weekFromNow },
    },
  })

  const recentActivities = await prisma.activity.findMany({
    where: { userId: USER_ID },
    include: { contact: true, opportunity: true },
    orderBy: { happenedAt: 'desc' },
    take: 5,
  })

  const upcomingTasks = await prisma.task.findMany({
    where: {
      userId: USER_ID,
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
      dueDate: { lte: weekFromNow },
    },
    orderBy: { dueDate: 'asc' },
    take: 5,
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-fmea-hi">Dashboard</h1>
        <p className="text-slate-600 dark:text-fmea-dim mt-1">Welcome back, Fraser</p>
      </div>

      <StatsCards
        openOpportunities={openOpps}
        weightedPipeline={Math.round(weightedTotal)}
        overdueTasks={overdueTasks}
        followUpsNeeded={followUpsNeeded}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <PipelineSummary data={pipelineByStage as any} />
        </div>
        <div>
          <RecentActivity activities={recentActivities as any} />
        </div>
      </div>

      <div className="mt-6">
        <UpcomingTasks tasks={upcomingTasks} />
      </div>
    </div>
  )
}
