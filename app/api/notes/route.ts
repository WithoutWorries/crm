import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = requireSession(request)
  if (session instanceof NextResponse) return session

  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const companyId = searchParams.get('companyId')
    const opportunityId = searchParams.get('opportunityId')

    const notes = await prisma.note.findMany({
      where: {
        ...(contactId ? { contactId } : {}),
        ...(companyId ? { companyId } : {}),
        ...(opportunityId ? { opportunityId } : {}),
      },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = requireSession(request)
  if (session instanceof NextResponse) return session

  try {
    const body = await request.json()
    const { content, contactId, companyId, opportunityId } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const note = await prisma.note.create({
      data: {
        content: content.trim(),
        userId: session.userId,
        ...(contactId ? { contactId } : {}),
        ...(companyId ? { companyId } : {}),
        ...(opportunityId ? { opportunityId } : {}),
      },
      include: { user: { select: { id: true, name: true } } },
    })
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}
