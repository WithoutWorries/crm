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
import { requireActiveSession } from '@/lib/session'

const DEFAULT_LIMIT = 30
const MAX_LIMIT = 50

interface KnowledgeSearchRow {
  id: string
  title: string | null
  content: string
  knowledgeType: KnowledgeType | null
  sourceUrl: string | null
  createdAt: Date
  updatedAt: Date
  rank: number
}

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

  try {
    if (!query) {
      const notes = await prisma.note.findMany({
        where: {
          userId: session.userId,
          isKnowledge: true,
          ...(knowledgeType ? { knowledgeType } : {}),
        },
        select: {
          id: true,
          title: true,
          content: true,
          knowledgeType: true,
          sourceUrl: true,
          createdAt: true,
          updatedAt: true,
        },
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

    const knowledgeType = isKnowledgeType(body.knowledgeType) ? body.knowledgeType : null
    const title = suppliedTitle ?? deriveKnowledgeTitle(content)

    const note = await prisma.note.create({
      data: {
        userId: session.userId,
        title,
        content,
        knowledgeType,
        sourceUrl,
        isKnowledge: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        knowledgeType: true,
        sourceUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await logAudit(session.userId, 'CREATE', 'Knowledge', note.id, note.title ?? undefined)
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('[KNOWLEDGE_POST_ERROR]', error)
    return NextResponse.json({ error: 'Unable to save your note' }, { status: 500 })
  }
}
