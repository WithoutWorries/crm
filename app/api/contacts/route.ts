import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { logAudit } from '@/lib/audit'
import { readJsonObject } from '@/lib/request'

export async function GET(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const companyId = searchParams.get('companyId') || ''
    const relationshipType = searchParams.get('relationshipType') || ''

    const contacts = await prisma.contact.findMany({
      where: {
        AND: [
          { user: { workspaceId: session.workspaceId } },
          search ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { jobTitle: { contains: search, mode: 'insensitive' } },
            ],
          } : {},
          companyId ? { companyId } : {},
          relationshipType ? { relationshipType: relationshipType as any } : {},
        ],
      },
      include: { company: true },
      orderBy: { fullName: 'asc' },
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('[CONTACTS_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const body = await readJsonObject(request)
    if (body instanceof NextResponse) return body
    if (body.companyId) {
      const company = await prisma.company.findFirst({
        where: { id: body.companyId, user: { workspaceId: session.workspaceId } },
        select: { id: true },
      })
      if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 400 })
    }
    const contact = await prisma.contact.create({
      data: {
        userId: session.userId,
        companyId: body.companyId || null,
        firstName: body.firstName,
        lastName: body.lastName || null,
        fullName: `${body.firstName}${body.lastName ? ' ' + body.lastName : ''}`,
        email: body.email || null,
        phone: body.phone || null,
        linkedinUrl: body.linkedinUrl || null,
        jobTitle: body.jobTitle || null,
        department: body.department || null,
        influenceLevel: body.influenceLevel || 'UNKNOWN',
        relationshipType: body.relationshipType || 'COLD',
        technicalFocus: body.technicalFocus || null,
        notes: body.notes || null,
        lastContactDate: body.lastContactDate ? new Date(body.lastContactDate) : null,
        nextFollowUpDate: body.nextFollowUpDate ? new Date(body.nextFollowUpDate) : null,
      },
    })
    await logAudit(session.userId, 'CREATE', 'Contact', contact.id, contact.fullName)
    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('[CONTACTS_POST_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
