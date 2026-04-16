import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  try {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        contacts: true,
        opportunities: true,
        _count: { select: { contacts: true, opportunities: true, tags: true } },
      },
    })
    if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(company)
  } catch (error) {
    console.error('[COMPANY_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  try {
    const company = await prisma.company.findUnique({ where: { id: params.id } })
    if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })

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
        regulatoryEnvironment: body.regulatoryEnvironment !== undefined ? body.regulatoryEnvironment : company.regulatoryEnvironment,
        notes: body.notes !== undefined ? body.notes : company.notes,
      },
    })
    await logAudit(session.userId, 'UPDATE', 'Company', updated.id, updated.name)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('[COMPANY_PUT_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  try {
    const company = await prisma.company.findUnique({ where: { id: params.id } })
    if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await logAudit(session.userId, 'DELETE', 'Company', company.id, company.name)
    await prisma.company.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[COMPANY_DELETE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
