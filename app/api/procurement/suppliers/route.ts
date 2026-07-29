import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { readJsonObject } from '@/lib/request'

export async function GET(_request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const suppliers = await prisma.procurementSupplier.findMany({
      where: { userId: session.userId },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(suppliers)
  } catch (err) {
    console.error('[PROCUREMENT_SUPPLIERS_GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const body = await readJsonObject(request)
    if (body instanceof NextResponse) return body
    // Upsert: reuse existing supplier with same name rather than error
    const supplier = await prisma.procurementSupplier.upsert({
      where: { userId_name: { userId: session.userId, name: body.name.trim() } },
      create: {
        userId:   session.userId,
        name:     body.name.trim(),
        website:  body.website  || null,
        location: body.location || null,
        notes:    body.notes    || null,
      },
      update: {
        website:  body.website  !== undefined ? body.website  : undefined,
        location: body.location !== undefined ? body.location : undefined,
        notes:    body.notes    !== undefined ? body.notes    : undefined,
      },
    })
    return NextResponse.json(supplier, { status: 201 })
  } catch (err) {
    console.error('[PROCUREMENT_SUPPLIERS_POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
