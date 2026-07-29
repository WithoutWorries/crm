import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { logAudit } from '@/lib/audit'
import { readJsonObject } from '@/lib/request'

export async function GET(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const search = request.nextUrl.searchParams.get('search') || ''
    const companies = await prisma.company.findMany({
      where: {
        user: { workspaceId: session.workspaceId },
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { country: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: { _count: { select: { contacts: true, opportunities: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(companies)
  } catch (error) {
    console.error('[COMPANIES_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const body = await readJsonObject(request)
    if (body instanceof NextResponse) return body
    const company = await prisma.company.create({
      data: {
        userId: session.userId,
        name: body.name,
        website: body.website || null,
        country: body.country || null,
        city: body.city || null,
        industry: body.industry || null,
        companyType: body.companyType || null,
        regulatoryEnvironment: body.regulatoryEnvironment || [],
        notes: body.notes || null,
      },
    })
    await logAudit(session.userId, 'CREATE', 'Company', company.id, company.name)
    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error('[COMPANIES_POST_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
