import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  try {
    const activity = await prisma.activity.findUnique({
      where: { id: params.id },
      include: { contact: true, opportunity: true, company: true },
    })
    if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(activity)
  } catch (error) {
    console.error('[ACTIVITY_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  try {
    const activity = await prisma.activity.findUnique({ where: { id: params.id } })
    if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const updated = await prisma.activity.update({
      where: { id: params.id },
      data: {
        type: body.type || activity.type,
        subject: body.subject || activity.subject,
        summary: body.summary !== undefined ? body.summary : activity.summary,
        details: body.details !== undefined ? body.details : activity.details,
        happenedAt: body.happenedAt ? new Date(body.happenedAt) : activity.happenedAt,
        contactId: body.contactId !== undefined ? body.contactId : activity.contactId,
        opportunityId: body.opportunityId !== undefined ? body.opportunityId : activity.opportunityId,
        companyId: body.companyId !== undefined ? body.companyId : activity.companyId,
        nextStep: body.nextStep !== undefined ? body.nextStep : activity.nextStep,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('[ACTIVITY_PUT_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireSession()
  if (session instanceof NextResponse) return session
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Only admins can delete records' }, { status: 403 })

  try {
    const activity = await prisma.activity.findUnique({ where: { id: params.id } })
    if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.activity.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ACTIVITY_DELETE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
