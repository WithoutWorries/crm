import { KnowledgeType, Prisma } from '@prisma/client'
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

const DEFAULT_LIMIT = 30
const MAX_LIMIT = 50

interface KnowledgeSearchRow {
  id: string
  title: string | null
  content: string
  knowledgeType: KnowledgeType | null
  sourceUrl: string | null
  capturedAt: Date | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
  rank: number
}

const knowledgeSelect = {
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

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT
  return Math.min(Math.max(parsed, 1), MAX_LIMIT)
}

export async function GET(request: NextRequest) {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  const typeParam = request.nextUrl.searchParams.get('type')
  const knowledgeType = isKnowledgeType(typeParam) ? typeParam : null
  const limit = parseLimit(request.nextUrl.searchParams.get('limit'))
  const showDeleted = request.nextUrl.searchParams.get('deleted') === 'true'

  try {
    if (showDeleted) {
      const notes = await prisma.note.findMany({
        where: {
          userId: session.userId,
          isKnowledge: true,
          deletedAt: { not: null },
        },
        select: knowledgeSelect,
        orderBy: { deletedAt: 'desc' },
        take: limit,
      })

      return NextResponse.json({ notes, query: '', deleted: true })
    }

    if (!query) {
      const notes = await prisma.note.findMany({
        where: {
          userId: session.userId,
          isKnowledge: true,
          deletedAt: null,
          ...(knowledgeType ? { knowledgeType } : {}),
        },
        select: knowledgeSelect,
        orderBy: { updatedAt: 'desc' },
        take: limit,
      })

      return NextResponse.json({ notes, query: '' })
    }

    const containsQuery = `%${query}%`
    const typeFilter = knowledgeType
      ? Prisma.sql`AND "knowledgeType" = ${knowledgeType}::"KnowledgeType"`
      : Prisma.empty

    const notes = await prisma.$queryRaw<KnowledgeSearchRow[]>(Prisma.sql`
      SELECT
        "id",
        "title",
        "content",
        "knowledgeType",
        "sourceUrl",
        "capturedAt",
        "deletedAt",
        "createdAt",
        "updatedAt",
        ts_rank_cd(
          to_tsvector('english', COALESCE("title", '') || ' ' || "content"),
          websearch_to_tsquery('english', ${query})
        )::float8 AS "rank"
      FROM "Note"
      WHERE
        "userId" = ${session.userId}
        AND "isKnowledge" = true
        AND "deletedAt" IS NULL
        ${typeFilter}
        AND (
          to_tsvector('english', COALESCE("title", '') || ' ' || "content")
            @@ websearch_to_tsquery('english', ${query})
          OR "title" ILIKE ${containsQuery}
          OR "content" ILIKE ${containsQuery}
        )
      ORDER BY "rank" DESC, "updatedAt" DESC
      LIMIT ${limit}
    `)

    return NextResponse.json({ notes, query })
  } catch (error) {
    console.error('[KNOWLEDGE_GET_ERROR]', error)
    return NextResponse.json({ error: 'Unable to search your notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  if (!requestHasJsonContentType(request)) {
    return NextResponse.json({ error: 'Expected a JSON request' }, { status: 415 })
  }

  try {
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

    const knowledgeType = isKnowledgeType(body.knowledgeType) ? body.knowledgeType : null
    const title = suppliedTitle ?? deriveKnowledgeTitle(content)
    const ownerUserId =
      typeof body.ownerUserId === 'string' ? body.ownerUserId.trim() : null
    if (ownerUserId && ownerUserId !== session.userId) {
      return NextResponse.json({ error: 'Capture owner does not match this session' }, { status: 403 })
    }

    const clientCaptureId =
      typeof body.clientCaptureId === 'string' ? body.clientCaptureId.trim().toLowerCase() : null
    if (
      clientCaptureId &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        clientCaptureId
      )
    ) {
      return NextResponse.json({ error: 'Invalid capture identifier' }, { status: 400 })
    }

    let capturedAt = new Date()
    if (body.clientCreatedAt !== undefined) {
      if (typeof body.clientCreatedAt !== 'string') {
        return NextResponse.json({ error: 'Invalid capture date' }, { status: 400 })
      }
      const suppliedDate = new Date(body.clientCreatedAt)
      const earliestAllowed = new Date('2000-01-01T00:00:00.000Z')
      const latestAllowed = new Date(Date.now() + 5 * 60 * 1000)
      if (
        Number.isNaN(suppliedDate.getTime()) ||
        suppliedDate < earliestAllowed ||
        suppliedDate > latestAllowed
      ) {
        return NextResponse.json({ error: 'Invalid capture date' }, { status: 400 })
      }
      capturedAt = suppliedDate
    }

    if (clientCaptureId) {
      const existing = await prisma.note.findUnique({
        where: {
          userId_clientCaptureId: {
            userId: session.userId,
            clientCaptureId,
          },
        },
        select: knowledgeSelect,
      })
      if (existing) return NextResponse.json(existing)
    }

    let note
    try {
      note = await prisma.note.create({
        data: {
          userId: session.userId,
          clientCaptureId,
          title,
          content,
          knowledgeType,
          sourceUrl,
          isKnowledge: true,
          capturedAt,
        },
        select: knowledgeSelect,
      })
    } catch (error) {
      // Two app windows can retry the same local capture simultaneously. The
      // compound unique key makes that safe; return the record that won.
      if (clientCaptureId && error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const existing = await prisma.note.findUnique({
            where: {
              userId_clientCaptureId: {
                userId: session.userId,
                clientCaptureId,
              },
            },
            select: knowledgeSelect,
          })
          if (existing) return NextResponse.json(existing)
        }
      }
      throw error
    }

    await logAudit(session.userId, 'CREATE', 'Knowledge', note.id, note.title ?? undefined)
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('[KNOWLEDGE_POST_ERROR]', error)
    return NextResponse.json({ error: 'Unable to save your note' }, { status: 500 })
  }
}
