import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import {
  deriveKnowledgeTitle,
  isKnowledgeType,
  MAX_KNOWLEDGE_TITLE_LENGTH,
  normalizeOptionalText,
  normalizeSourceUrl,
  requestHasJsonContentType,
  validateKnowledgeContent,
} from '@/lib/knowledge'
import { prisma } from '@/lib/prisma'
import { requireActiveSession } from '@/lib/session'

const noteSelect = {
  id: true,
  title: true,
  content: true,
  knowledgeType: true,
  sourceUrl: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const note = await prisma.note.findFirst({
    where: { id: params.id, userId: session.userId, isKnowledge: true },
    select: noteSelect,
  })

  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  return NextResponse.json(note)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  if (!requestHasJsonContentType(request)) {
    return NextResponse.json({ error: 'Expected a JSON request' }, { status: 415 })
  }

  try {
    const existing = await prisma.note.findFirst({
      where: { id: params.id, userId: session.userId, isKnowledge: true },
      select: { id: true },
    })
    if (!existing) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

    const body = await request.json()
    const content = validateKnowledgeContent(body.content)
    if (!content) {
      return NextResponse.json(
        { error: 'Enter a note of no more than 100,000 characters' },
        { status: 400 }
      )
    }

    const suppliedTitle = normalizeOptionalText(body.title, MAX_KNOWLEDGE_TITLE_LENGTH)
    const sourceUrl = body.sourceUrl ? normalizeSourceUrl(body.sourceUrl) : null
    if (body.sourceUrl && !sourceUrl) {
      return NextResponse.json({ error: 'Source URL must be a valid HTTP or HTTPS link' }, { status: 400 })
    }

    if (body.knowledgeType !== null && body.knowledgeType !== undefined && !isKnowledgeType(body.knowledgeType)) {
      return NextResponse.json({ error: 'Unknown knowledge type' }, { status: 400 })
    }

    const note = await prisma.note.update({
      where: { id: existing.id },
      data: {
        title: suppliedTitle ?? deriveKnowledgeTitle(content),
        content,
        knowledgeType: isKnowledgeType(body.knowledgeType) ? body.knowledgeType : null,
        sourceUrl,
      },
      select: noteSelect,
    })

    await logAudit(session.userId, 'UPDATE', 'Knowledge', note.id, note.title ?? undefined)
    return NextResponse.json(note)
  } catch (error) {
    console.error('[KNOWLEDGE_PUT_ERROR]', error)
    return NextResponse.json({ error: 'Unable to update your note' }, { status: 500 })
  }
}
