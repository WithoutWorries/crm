import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { OpportunityStage } from '@prisma/client'

export async function GET(request: NextRequest) {
  const session = requireSession(request)
  if (session instanceof NextResponse) return session

  try {
    const now = new Date()

    const openOpportunities = await prisma.opportunity.count({
      where: { stage: { notIn: ['WON', 'LOST'] } },
    })

    const opportunities = await prisma.opportunity.findMany({
      where: { stage: { notIn: ['WON', 'LOST'] } },
      select: { estimatedValue: true, probabilityPercent: true },
    })

    const weightedPipelineTotal = opportunities.reduce((sum, opp) => {
      if (opp.estimatedValue && opp.probabilityPercent) {
        return sum + Number(opp.estimatedValue) * (opp.probabilityPercent / 100)
      }
      return sum
    }, 0)

    const overdueTasks = await prisma.task.count({
      where: {
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      },
    })

    const followUpsNeeded = await prisma.contact.count({
      where: { nextFollowUpDate: { lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) } },
    })

    const stages: OpportunityStage[] = [
      'NEW_LEAD', 'INITIAL_CONTACT', 'TECHNICAL_DISCUSSION', 'PROBLEM_DEFINED',
      'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST',
    ]

    const pipelineByStage = await Promise.all(stages.map(async (stage) => {
      const opps = await prisma.opportunity.findMany({
        where: { stage },
        select: { estimatedValue: true, probabilityPercent: true },
      })
      const count = opps.length
      const value = opps.reduce((sum, opp) => {
        if (opp.estimatedValue && opp.probabilityPercent) {
          return sum + Number(opp.estimatedValue) * (opp.probabilityPercent / 100)
        }
        return sum
      }, 0)
      return { stage, count, value: Math.round(value) }
    }))

    const recentActivities = await prisma.activity.findMany({
      include: { contact: true, opportunity: true },
      orderBy: { happenedAt: 'desc' },
      take: 5,
    })

    const upcomingTasks = await prisma.task.findMany({
      where: {
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    })

    return NextResponse.json({
      openOpportunities,
      weightedPipelineTotal: Math.round(weightedPipelineTotal),
      overdueTasks,
      followUpsNeeded,
      pipelineByStage,
      recentActivities,
      upcomingTasks,
    })
  } catch (error) {
    console.error('[DASHBOARD_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
