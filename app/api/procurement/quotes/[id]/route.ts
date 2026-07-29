import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { readJsonObject } from '@/lib/request'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const quote = await prisma.procurementQuote.findFirst({
      where: { id },
      include: { project: { select: { userId: true } } },
    })
    if (!quote || quote.project.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await readJsonObject(request)
    if (body instanceof NextResponse) return body
    const updated = await prisma.procurementQuote.update({
      where: { id },
      data: {
        status:          body.status          ?? quote.status,
        feeAmount:       body.feeAmount        !== undefined ? body.feeAmount        : quote.feeAmount,
        feeCurrency:     body.feeCurrency      ?? quote.feeCurrency,
        feeType:         body.feeType          ?? quote.feeType,
        servicesOffered: body.servicesOffered  !== undefined ? body.servicesOffered  : quote.servicesOffered,
        availability:    body.availability     !== undefined ? body.availability     : quote.availability,
        experienceNotes: body.experienceNotes  !== undefined ? body.experienceNotes  : quote.experienceNotes,
        prosNotes:       body.prosNotes        !== undefined ? body.prosNotes        : quote.prosNotes,
        consNotes:       body.consNotes        !== undefined ? body.consNotes        : quote.consNotes,
        receivedAt:      body.receivedAt ? new Date(body.receivedAt) : quote.receivedAt,
      },
      include: { supplier: true },
    })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PROCUREMENT_QUOTE_PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const quote = await prisma.procurementQuote.findFirst({
      where: { id },
      include: { project: { select: { userId: true } } },
    })
    if (!quote || quote.project.userId !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await prisma.procurementQuote.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PROCUREMENT_QUOTE_DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
