import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { readJsonObject } from '@/lib/request'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const project = await prisma.procurementProject.findFirst({
      where: { id, userId: session.userId },
      include: {
        quotes: {
          include: { supplier: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(project)
  } catch (err) {
    console.error('[PROCUREMENT_PROJECT_GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const project = await prisma.procurementProject.findFirst({
      where: { id, userId: session.userId },
    })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await readJsonObject(request)
    if (body instanceof NextResponse) return body
    const updated = await prisma.procurementProject.update({
      where: { id },
      data: {
        title:           body.title           ?? project.title,
        category:        body.category        ?? project.category,
        description:     body.description     !== undefined ? body.description     : project.description,
        status:          body.status          ?? project.status,
        decisionDeadline: body.decisionDeadline !== undefined
          ? (body.decisionDeadline ? new Date(body.decisionDeadline) : null)
          : project.decisionDeadline,
        notes: body.notes !== undefined ? body.notes : project.notes,
      },
    })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PROCUREMENT_PROJECT_PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const project = await prisma.procurementProject.findFirst({
      where: { id, userId: session.userId },
    })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.procurementProject.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PROCUREMENT_PROJECT_DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
