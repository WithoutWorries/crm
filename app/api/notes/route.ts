import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, contactId, companyId, opportunityId } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Use a fixed system userId — will become dynamic when multi-user is added
    let userId: string
    const firstUser = await prisma.user.findFirst()
    if (!firstUser) {
      return NextResponse.json({ error: 'No user found' }, { status: 500 })
    }
    userId = firstUser.id

    const note = await prisma.note.create({
      data: {
        content: content.trim(),
        userId,
        ...(contactId ? { contactId } : {}),
        ...(companyId ? { companyId } : {}),
        ...(opportunityId ? { opportunityId } : {}),
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}
