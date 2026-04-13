import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpportunityStage } from '@prisma/client'

const USER_ID = 'user_1'

export async function GET(_request: NextRequest) {
  try {
    const now = new Date()

    // Get open opportunities count
    const openOpportunities = await prisma.opportunity.count({
      where: {
        userId: USER_ID,
        stage: {
          notIn: ['WON', 'LOST'],
        },
      },
    })

    // Get weighted pipeline total
    const opportunities = await prisma.opportunity.findMany({
      where: {
        userId: USER_ID,
        stage: {
          notIn: ['WON', 'LOST'],
        },
      },
      select: {
        estimatedValue: true,
        probabilityPercent: true,
      },
    })

    const weightedPipelineTotal = opportunities.reduce((sum, opp) => {
      if (opp.estimatedValue && opp.probabilityPercent) {
        return sum + Number(opp.estimatedValue) * (opp.probabilityPercent / 100)
      }
      return sum
    }, 0)

    // Get overdue tasks count
    const overdueTasks = await prisma.task.count({
      where: {
        userId: USER_ID,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: {
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
      },
    })

    // Get follow-ups needed (contacts with nextFollowUpDate <= today)
    const followUpsNeeded = await prisma.contact.count({
      where: {
        userId: USER_ID,
        nextFollowUpDate: {
          lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      },
    })

    // Get pipeline by stage
    const stages: OpportunityStage[] = [
      'NEW_LEAD',
      'INITIAL_CONTACT',
      'TECHNICAL_DISCUSSION',
      'PROBLEM_DEFINED',
      'PROPOSAL_SENT',
      'NEGOTIATION',
      'WON',
      'LOST',
    ]

    const pipelineByStage = await Promise.all(
      stages.map(async (stage) => {
        const opps = await prisma.opportunity.findMany({
          where: { userId: USER_ID, stage },
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
      })
    )

    // Get recent activities (last 5)
    const recentActivities = await prisma.activity.findMany({
      where: { userId: USER_ID },
      include: {
        contact: true,
        opportunity: true,
      },
      orderBy: { happenedAt: 'desc' },
      take: 5,
    })

    // Get upcoming tasks (open, due soon or overdue)
    const upcomingTasks = await prisma.task.findMany({
      where: {
        userId: USER_ID,
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
