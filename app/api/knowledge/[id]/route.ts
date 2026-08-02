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
import { readJsonObject } from '@/lib/request'
import { requireActiveSession } from '@/lib/session'

const noteSelect = {
  id: true,
  title: true,
  content: true,
  knowledgeType: true,
  sourceUrl: true,
  capturedAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const note = await prisma.note.findFirst({
    where: { id, userId: session.userId, isKnowledge: true, deletedAt: null },
    select: noteSelect,
  })

  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  return NextResponse.json(note)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  if (!requestHasJsonContentType(request)) {
    return NextResponse.json({ error: 'Expected a JSON request' }, { status: 415 })
  }

  try {
    const existing = await prisma.note.findFirst({
      where: { id, userId: session.userId, isKnowledge: true, deletedAt: null },
      select: { id: true },
    })
    if (!existing) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

    const body = await readJsonObject(request, 128 * 1024)
    if (body instanceof NextResponse) return body
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  if (!requestHasJsonContentType(request)) {
    return NextResponse.json({ error: 'Expected a JSON request' }, { status: 415 })
  }

  try {
    const body = await readJsonObject(request, 8 * 1024)
    if (body instanceof NextResponse) return body
    if (body.action !== 'restore') {
      return NextResponse.json({ error: 'Unknown note action' }, { status: 400 })
    }

    const existing = await prisma.note.findFirst({
      where: {
        id,
        userId: session.userId,
        isKnowledge: true,
        deletedAt: { not: null },
      },
      select: { id: true },
    })
    if (!existing) return NextResponse.json({ error: 'Deleted note not found' }, { status: 404 })

    const note = await prisma.note.update({
      where: { id: existing.id },
      data: { deletedAt: null },
      select: noteSelect,
    })

    await logAudit(session.userId, 'UPDATE', 'Knowledge', note.id, `Restored: ${note.title ?? 'Untitled note'}`)
    return NextResponse.json(note)
  } catch (error) {
    console.error('[KNOWLEDGE_PATCH_ERROR]', error)
    return NextResponse.json({ error: 'Unable to restore your note' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const permanent = request.nextUrl.searchParams.get('permanent') === 'true'

  try {
    const existing = await prisma.note.findFirst({
      where: { id, userId: session.userId, isKnowledge: true },
      select: { id: true, title: true, deletedAt: true },
    })
    if (!existing) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

    if (permanent) {
      if (!existing.deletedAt) {
        return NextResponse.json(
          { error: 'Move the note to Recently Deleted before deleting it permanently' },
          { status: 409 }
        )
      }

      await prisma.note.delete({ where: { id: existing.id } })
      await logAudit(
        session.userId,
        'DELETE',
        'Knowledge',
        existing.id,
        `Permanently deleted: ${existing.title ?? 'Untitled note'}`
      )
      return NextResponse.json({ success: true, permanent: true })
    }

    if (existing.deletedAt) {
      return NextResponse.json({ success: true, deletedAt: existing.deletedAt })
    }

    const note = await prisma.note.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    })
    await logAudit(session.userId, 'DELETE', 'Knowledge', note.id, existing.title ?? undefined)
    return NextResponse.json({ success: true, deletedAt: note.deletedAt })
  } catch (error) {
    console.error('[KNOWLEDGE_DELETE_ERROR]', error)
    return NextResponse.json({ error: 'Unable to delete your note' }, { status: 500 })
  }
}
