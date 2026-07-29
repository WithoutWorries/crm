import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { logAudit } from '@/lib/audit'
import { readJsonObject } from '@/lib/request'

export async function GET(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const searchParams = request.nextUrl.searchParams
    const contactId = searchParams.get('contactId') || ''
    const opportunityId = searchParams.get('opportunityId') || ''
    const companyId = searchParams.get('companyId') || ''
    const type = searchParams.get('type') || ''

    const activities = await prisma.activity.findMany({
      where: {
        user: { workspaceId: session.workspaceId },
        ...(contactId ? { contactId } : {}),
        ...(opportunityId ? { opportunityId } : {}),
        ...(companyId ? { companyId } : {}),
        ...(type ? { type: type as any } : {}),
      },
      include: { contact: true, opportunity: true, company: true },
      orderBy: { happenedAt: 'desc' },
    })
    return NextResponse.json(activities)
  } catch (error) {
    console.error('[ACTIVITIES_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const body = await readJsonObject(request)
    if (body instanceof NextResponse) return body
    const references = await Promise.all([
      body.companyId
        ? prisma.company.findFirst({
            where: { id: body.companyId, user: { workspaceId: session.workspaceId } },
            select: { id: true },
          })
        : null,
      body.contactId
        ? prisma.contact.findFirst({
            where: { id: body.contactId, user: { workspaceId: session.workspaceId } },
            select: { id: true },
          })
        : null,
      body.opportunityId
        ? prisma.opportunity.findFirst({
            where: { id: body.opportunityId, user: { workspaceId: session.workspaceId } },
            select: { id: true },
          })
        : null,
    ])
    if (
      (body.companyId && !references[0]) ||
      (body.contactId && !references[1]) ||
      (body.opportunityId && !references[2])
    ) {
      return NextResponse.json({ error: 'Related record not found' }, { status: 400 })
    }
    const activity = await prisma.activity.create({
      data: {
        userId: session.userId,
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
    await logAudit(session.userId, 'CREATE', 'Activity', activity.id, activity.subject)
    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('[ACTIVITIES_POST_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
