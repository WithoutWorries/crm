import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const USER_ID = 'user_1'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        opportunities: true,
        activities: true,
        tasks: true,
        notesList: true,
      },
    })

    if (!contact || contact.userId !== USER_ID) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('[CONTACT_GET_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
    })

    if (!contact || contact.userId !== USER_ID) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()

    const updated = await prisma.contact.update({
      where: { id: params.id },
      data: {
        companyId: body.companyId !== undefined ? body.companyId : contact.companyId,
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
        nextFollowUpDate: body.nextFollowUpDate
          ? new Date(body.nextFollowUpDate)
          : contact.nextFollowUpDate,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[CONTACT_PUT_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
    })

    if (!contact || contact.userId !== USER_ID) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.contact.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CONTACT_DELETE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
