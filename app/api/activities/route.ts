import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const USER_ID = 'user_1'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const contactId = searchParams.get('contactId') || ''
    const opportunityId = searchParams.get('opportunityId') || ''
    const type = searchParams.get('type') || ''

    const activities = await prisma.activity.findMany({
      where: {
        userId: USER_ID,
        ...(contactId ? { contactId } : {}),
        ...(opportunityId ? { opportunityId } : {}),
        ...(type ? { type } : {}),
      },
      include: {
        contact: true,
        opportunity: true,
        company: true,
      },
      orderBy: { happenedAt: 'desc' },
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('[ACTIVITIES_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const activity = await prisma.activity.create({
      data: {
        userId: USER_ID,
        type: body.type,
        subject: body.subject,
        summary: body.summary || null,
        details: body.details || null,
        happenedAt: body.happenedAt ? new Date(body.happenedAt) : new Date(),
        contactId: body.contactId || null,
        opportunityId: body.opportunityId || null,
        companyId: body.companyId || null,
        nextStep: body.nextStep || null,
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('[ACTIVITIES_POST_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
