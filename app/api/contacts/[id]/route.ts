import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { logAudit } from '@/lib/audit'
import { workspaceReferencesExist } from '@/lib/access'
import { readJsonObject } from '@/lib/request'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const contact = await prisma.contact.findFirst({
      where: { id, user: { workspaceId: session.workspaceId } },
      include: { company: true, opportunities: true, activities: true, tasks: true, notesList: true },
    })
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(contact)
  } catch (error) {
    console.error('[CONTACT_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const contact = await prisma.contact.findFirst({
      where: { id, user: { workspaceId: session.workspaceId } },
    })
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await readJsonObject(request)
    if (body instanceof NextResponse) return body
    const companyId = body.companyId !== undefined ? body.companyId : contact.companyId
    if (!(await workspaceReferencesExist(session.workspaceId, { companyId }))) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 })
    }
    const updated = await prisma.contact.update({
      where: { id },
      data: {
        companyId,
        firstName: body.firstName || contact.firstName,
        lastName: body.lastName !== undefined ? body.lastName : contact.lastName,
        fullName: body.fullName || contact.fullName,
        email: body.email !== undefined ? body.email : contact.email,
        phone: body.phone !== undefined ? body.phone : contact.phone,
        linkedinUrl: body.linkedinUrl !== undefined ? body.linkedinUrl : contact.linkedinUrl,
        jobTitle: body.jobTitle !== undefined ? body.jobTitle : contact.jobTitle,
        department: body.department !== undefined ? body.department : contact.department,
        influenceLevel: body.influenceLevel || contact.influenceLevel,
        relationshipType: body.relationshipType || contact.relationshipType,
        technicalFocus: body.technicalFocus !== undefined ? body.technicalFocus : contact.technicalFocus,
        notes: body.notes !== undefined ? body.notes : contact.notes,
        lastContactDate: body.lastContactDate ? new Date(body.lastContactDate) : contact.lastContactDate,
        nextFollowUpDate: body.nextFollowUpDate ? new Date(body.nextFollowUpDate) : contact.nextFollowUpDate,
      },
    })
    await logAudit(session.userId, 'UPDATE', 'Contact', updated.id, updated.fullName)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('[CONTACT_PUT_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession()
  if (session instanceof NextResponse) return session
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Only admins can delete records' }, { status: 403 })

  try {
    const contact = await prisma.contact.findFirst({
      where: { id, user: { workspaceId: session.workspaceId } },
    })
    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await logAudit(session.userId, 'DELETE', 'Contact', contact.id, contact.fullName)
    await prisma.contact.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CONTACT_DELETE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
