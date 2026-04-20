import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'

export async function GET(_request: NextRequest) {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  try {
    const projects = await prisma.procurementProject.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        quotes: {
          include: { supplier: { select: { id: true, name: true } } },
        },
      },
    })
    return NextResponse.json(projects)
  } catch (err) {
    console.error('[PROCUREMENT_PROJECTS_GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  try {
    const body = await request.json()
    const project = await prisma.procurementProject.create({
      data: {
        userId:          session.userId,
        title:           body.title,
        category:        body.category,
        description:     body.description   || null,
        status:          body.status        || 'OPEN',
        decisionDeadline: body.decisionDeadline ? new Date(body.decisionDeadline) : null,
        notes:           body.notes         || null,
      },
    })
    return NextResponse.json(project, { status: 201 })
  } catch (err) {
    console.error('[PROCUREMENT_PROJECTS_POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
