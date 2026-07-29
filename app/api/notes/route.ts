import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { readJsonObject } from '@/lib/request'

export async function GET(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const companyId = searchParams.get('companyId')
    const opportunityId = searchParams.get('opportunityId')

    const notes = await prisma.note.findMany({
      where: {
        user: { workspaceId: session.workspaceId },
        isKnowledge: false,
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
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const body = await readJsonObject(request)
    if (body instanceof NextResponse) return body
    const { content, contactId, companyId, opportunityId } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const references = await Promise.all([
      companyId
        ? prisma.company.findFirst({
            where: { id: companyId, user: { workspaceId: session.workspaceId } },
            select: { id: true },
          })
        : null,
      contactId
        ? prisma.contact.findFirst({
            where: { id: contactId, user: { workspaceId: session.workspaceId } },
            select: { id: true },
          })
        : null,
      opportunityId
        ? prisma.opportunity.findFirst({
            where: { id: opportunityId, user: { workspaceId: session.workspaceId } },
            select: { id: true },
          })
        : null,
    ])
    if (
      (companyId && !references[0]) ||
      (contactId && !references[1]) ||
      (opportunityId && !references[2])
    ) {
      return NextResponse.json({ error: 'Related record not found' }, { status: 400 })
    }

    const note = await prisma.note.create({
      data: {
        content: content.trim(),
        userId: session.userId,
        isKnowledge: false,
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
