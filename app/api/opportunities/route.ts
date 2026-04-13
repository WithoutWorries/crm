import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const USER_ID = 'user_1'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const stage = searchParams.get('stage') || ''

    const opportunities = await prisma.opportunity.findMany({
      where: {
        userId: USER_ID,
        AND: [
          search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          stage ? { stage: stage as any } : {},
        ],
      },
      include: {
        company: true,
        primaryContact: true,
      },
      orderBy: { expectedCloseDate: 'asc' },
    })

    return NextResponse.json(
      opportunities.map((opp) => ({
        ...opp,
        estimatedValue: opp.estimatedValue ? Number(opp.estimatedValue) : null,
        weightedValue:
          opp.estimatedValue && opp.probabilityPercent
            ? Math.round(Number(opp.estimatedValue) * (opp.probabilityPercent / 100))
            : 0,
      }))
    )
  } catch (error) {
    console.error('[OPPORTUNITIES_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const opportunity = await prisma.opportunity.create({
      data: {
        userId: USER_ID,
        companyId: body.companyId || null,
        primaryContactId: body.primaryContactId || null,
        title: body.title,
        description: body.description || null,
        stage: body.stage || 'NEW_LEAD',
        industry: body.industry || null,
        systemType: body.systemType || null,
        projectPhase: body.projectPhase || 'UNKNOWN',
        regulatoryDrivers: body.regulatoryDrivers || [],
        services: body.services || [],
        estimatedValue: body.estimatedValue ? new Decimal(body.estimatedValue) : null,
        currency: body.currency || 'EUR',
        probabilityPercent: body.probabilityPercent || null,
        urgency: body.urgency || 'MEDIUM',
        source: body.source || null,
        painPoints: body.painPoints || null,
        competitor: body.competitor || null,
        expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
        nextAction: body.nextAction || null,
      },
    })

    return NextResponse.json(
      {
        ...opportunity,
        estimatedValue: opportunity.estimatedValue ? Number(opportunity.estimatedValue) : null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[OPPORTUNITIES_POST_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { Decimal } from '@prisma/client/runtime/library'
