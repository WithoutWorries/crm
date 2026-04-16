import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  try {
    const status = request.nextUrl.searchParams.get('status') || ''
    const tasks = await prisma.task.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: status ? { status: status as any } : undefined,
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
  const session = requireSession()
  if (session instanceof NextResponse) return session

  try {
    const body = await request.json()
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
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('[TASKS_POST_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
