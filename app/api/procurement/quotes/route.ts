import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { readJsonObject } from '@/lib/request'

// POST: create a quote. Accepts either supplierId (existing) or supplierName (creates on the fly).
export async function POST(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const body = await readJsonObject(request)
    if (body instanceof NextResponse) return body

    if (!body.projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    // Verify project belongs to this user
    const project = await prisma.procurementProject.findFirst({
      where: { id: body.projectId, userId: session.userId },
    })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Resolve supplier — use existing id or create/find by name
    let supplierId: string = body.supplierId ?? ''
    if (!supplierId && body.supplierName?.trim()) {
      const supplier = await prisma.procurementSupplier.upsert({
        where: { userId_name: { userId: session.userId, name: body.supplierName.trim() } },
        create: { userId: session.userId, name: body.supplierName.trim() },
        update: {},
      })
      supplierId = supplier.id
    }
    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier name or supplierId is required' }, { status: 400 })
    }

    const quote = await prisma.procurementQuote.create({
      data: {
        projectId:       body.projectId,
        supplierId,
        status:          body.status          || 'RECEIVED',
        feeAmount:       body.feeAmount        ?? null,
        feeCurrency:     body.feeCurrency      || 'EUR',
        feeType:         body.feeType          || 'TBC',
        servicesOffered: body.servicesOffered  || null,
        availability:    body.availability     || null,
        experienceNotes: body.experienceNotes  || null,
        prosNotes:       body.prosNotes        || null,
        consNotes:       body.consNotes        || null,
        receivedAt:      body.receivedAt ? new Date(body.receivedAt) : new Date(),
      },
      include: { supplier: true },
    })
    return NextResponse.json(quote, { status: 201 })
  } catch (err) {
    console.error('[PROCUREMENT_QUOTES_POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
