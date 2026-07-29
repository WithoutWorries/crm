import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { logAudit } from '@/lib/audit'
import { readJsonObject } from '@/lib/request'

export async function GET(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const status = request.nextUrl.searchParams.get('status') || ''
    const tasks = await prisma.task.findMany({
      where: {
        user: { workspaceId: session.workspaceId },
        ...(status ? { status: status as any } : {}),
      },
      include: { contact: true, opportunity: true, company: true },
      orderBy: { dueDate: 'asc' },
    })
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('[TASKS_GET_ERROR]', error)
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
    const task = await prisma.task.create({
      data: {
        userId: session.userId,
        title: body.title,
        description: body.description || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        priority: body.priority || 'MEDIUM',
        status: body.status || 'OPEN',
        contactId: body.contactId || null,
        opportunityId: body.opportunityId || null,
        companyId: body.companyId || null,
      },
    })
    await logAudit(session.userId, 'CREATE', 'Task', task.id, task.title)
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('[TASKS_POST_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
