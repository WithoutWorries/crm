import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: { contact: true, opportunity: true, company: true },
    })
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(task)
  } catch (error) {
    console.error('[TASK_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  try {
    const task = await prisma.task.findUnique({ where: { id: params.id } })
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const updated = await prisma.task.update({
      where: { id: params.id },
      data: {
        title: body.title || task.title,
        description: body.description !== undefined ? body.description : task.description,
        dueDate: body.dueDate ? new Date(body.dueDate) : task.dueDate,
        priority: body.priority || task.priority,
        status: body.status || task.status,
        completedAt: body.status === 'COMPLETED' ? new Date() : task.completedAt,
        contactId: body.contactId !== undefined ? body.contactId : task.contactId,
        opportunityId: body.opportunityId !== undefined ? body.opportunityId : task.opportunityId,
        companyId: body.companyId !== undefined ? body.companyId : task.companyId,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('[TASK_PUT_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  try {
    const task = await prisma.task.findUnique({ where: { id: params.id } })
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.task.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[TASK_DELETE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
