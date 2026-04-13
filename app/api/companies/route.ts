import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const USER_ID = 'user_1'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''

    const companies = await prisma.company.findMany({
      where: {
        userId: USER_ID,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { country: { contains: search, mode: 'insensitive' } },
        ],
      },
      include: {
        _count: {
          select: { contacts: true, opportunities: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(companies)
  } catch (error) {
    console.error('[COMPANIES_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const company = await prisma.company.create({
      data: {
        userId: USER_ID,
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

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error('[COMPANIES_POST_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
