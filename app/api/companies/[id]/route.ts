import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const USER_ID = 'user_1'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        contacts: true,
        opportunities: true,
        _count: {
          select: { contacts: true, opportunities: true, tags: true },
        },
      },
    })

    if (!company || company.userId !== USER_ID) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('[COMPANY_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
    })

    if (!company || company.userId !== USER_ID) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()

    const updated = await prisma.company.update({
      where: { id: params.id },
      data: {
        name: body.name || company.name,
        website: body.website !== undefined ? body.website : company.website,
        country: body.country !== undefined ? body.country : company.country,
        city: body.city !== undefined ? body.city : company.city,
        industry: body.industry !== undefined ? body.industry : company.industry,
        companyType: body.companyType !== undefined ? body.companyType : company.companyType,
        regulatoryEnvironment:
          body.regulatoryEnvironment !== undefined
            ? body.regulatoryEnvironment
            : company.regulatoryEnvironment,
        notes: body.notes !== undefined ? body.notes : company.notes,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[COMPANY_PUT_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
    })

    if (!company || company.userId !== USER_ID) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.company.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[COMPANY_DELETE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
