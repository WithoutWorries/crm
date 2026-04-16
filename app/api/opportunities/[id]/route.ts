import { NextRequest, NextResponse } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        primaryContact: true,
        contacts: { include: { contact: true } },
        activities: true,
        tasks: true,
        notes: true,
      },
    })
    if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      ...opportunity,
      estimatedValue: opportunity.estimatedValue ? Number(opportunity.estimatedValue) : null,
      weightedValue: opportunity.estimatedValue && opportunity.probabilityPercent
        ? Math.round(Number(opportunity.estimatedValue) * (opportunity.probabilityPercent / 100))
        : 0,
    })
  } catch (error) {
    console.error('[OPPORTUNITY_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  try {
    const opportunity = await prisma.opportunity.findUnique({ where: { id: params.id } })
    if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const updated = await prisma.opportunity.update({
      where: { id: params.id },
      data: {
        companyId: body.companyId !== undefined ? body.companyId : opportunity.companyId,
        primaryContactId: body.primaryContactId !== undefined ? body.primaryContactId : opportunity.primaryContactId,
        title: body.title || opportunity.title,
        description: body.description !== undefined ? body.description : opportunity.description,
        stage: body.stage || opportunity.stage,
        industry: body.industry !== undefined ? body.industry : opportunity.industry,
        systemType: body.systemType !== undefined ? body.systemType : opportunity.systemType,
        projectPhase: body.projectPhase || opportunity.projectPhase,
        regulatoryDrivers: body.regulatoryDrivers !== undefined ? body.regulatoryDrivers : opportunity.regulatoryDrivers,
        services: body.services !== undefined ? body.services : opportunity.services,
        estimatedValue: body.estimatedValue ? new Decimal(body.estimatedValue) : opportunity.estimatedValue,
        currency: body.currency || opportunity.currency,
        probabilityPercent: body.probabilityPercent || opportunity.probabilityPercent,
        urgency: body.urgency || opportunity.urgency,
        source: body.source !== undefined ? body.source : opportunity.source,
        painPoints: body.painPoints !== undefined ? body.painPoints : opportunity.painPoints,
        competitor: body.competitor !== undefined ? body.competitor : opportunity.competitor,
        expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : opportunity.expectedCloseDate,
        nextAction: body.nextAction !== undefined ? body.nextAction : opportunity.nextAction,
        lastActivityDate: body.lastActivityDate ? new Date(body.lastActivityDate) : opportunity.lastActivityDate,
        lostReason: body.lostReason !== undefined ? body.lostReason : opportunity.lostReason,
        wonDate: body.wonDate ? new Date(body.wonDate) : opportunity.wonDate,
        lostDate: body.lostDate ? new Date(body.lostDate) : opportunity.lostDate,
      },
    })
    await logAudit(session.userId, 'UPDATE', 'Opportunity', updated.id, updated.title)
    return NextResponse.json({
      ...updated,
      estimatedValue: updated.estimatedValue ? Number(updated.estimatedValue) : null,
      weightedValue: updated.estimatedValue && updated.probabilityPercent
        ? Math.round(Number(updated.estimatedValue) * (updated.probabilityPercent / 100))
        : 0,
    })
  } catch (error) {
    console.error('[OPPORTUNITY_PUT_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  try {
    const opportunity = await prisma.opportunity.findUnique({ where: { id: params.id } })
    if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await logAudit(session.userId, 'DELETE', 'Opportunity', opportunity.id, opportunity.title)
    await prisma.opportunity.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[OPPORTUNITY_DELETE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
