import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const USER_ID = 'user_1'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const companyId = searchParams.get('companyId') || ''
    const relationshipType = searchParams.get('relationshipType') || ''

    const contacts = await prisma.contact.findMany({
      where: {
        userId: USER_ID,
        AND: [
          search
            ? {
                OR: [
                  { fullName: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                  { jobTitle: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          companyId ? { companyId } : {},
          relationshipType ? { relationshipType } : {},
        ],
      },
      include: {
        company: true,
      },
      orderBy: { fullName: 'asc' },
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('[CONTACTS_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const contact = await prisma.contact.create({
      data: {
        userId: USER_ID,
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

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('[CONTACTS_POST_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
