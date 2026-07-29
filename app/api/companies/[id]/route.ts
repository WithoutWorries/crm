import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { logAudit } from '@/lib/audit'
import { readJsonObject } from '@/lib/request'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const company = await prisma.company.findFirst({
      where: { id, user: { workspaceId: session.workspaceId } },
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const company = await prisma.company.findFirst({
      where: { id, user: { workspaceId: session.workspaceId } },
    })
    if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await readJsonObject(request)
    if (body instanceof NextResponse) return body
    const updated = await prisma.company.update({
      where: { id },
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

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession()
  if (session instanceof NextResponse) return session
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Only admins can delete records' }, { status: 403 })

  try {
    const company = await prisma.company.findFirst({
      where: { id, user: { workspaceId: session.workspaceId } },
    })
    if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await logAudit(session.userId, 'DELETE', 'Company', company.id, company.name)
    await prisma.company.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[COMPANY_DELETE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
