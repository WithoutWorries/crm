import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { optionalString, readJsonObject } from '@/lib/request'
import { requireActiveSession } from '@/lib/session'
import { parseDateOnly, rebuildCalculatedVat } from '@/lib/tax'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const entry = await prisma.taxCashEntry.findFirst({
    where: { id, userId: session.userId },
  })
  if (!entry) return NextResponse.json({ error: 'Cash entry not found' }, { status: 404 })
  if (entry.type !== 'CLIENT_REMITTANCE') {
    return NextResponse.json({ error: 'Only a client remittance can await payment' }, { status: 409 })
  }


  const body = await readJsonObject(request, 8 * 1024)
  if (body instanceof NextResponse) return body
  if (body.action === 'updateReference') {
    const reference = optionalString(body.reference, 120)
    if (!reference) {
      return NextResponse.json({ error: 'Enter the document or invoice number from the remittance' }, { status: 400 })
    }
    const updated = await prisma.taxCashEntry.update({
      where: { id },
      data: { reference },
    })
    await logAudit(session.userId, 'UPDATE', 'TaxCashEntry', id)
    return NextResponse.json(updated)
  }
  if (body.action !== 'recordPayment') {
    return NextResponse.json({ error: 'Unsupported cash-entry action' }, { status: 400 })
  }
  const paymentDate = parseDateOnly(body.paymentDate)
  if (!paymentDate) {
    return NextResponse.json({ error: 'Enter the date the payment reached the bank' }, { status: 400 })
  }

  const updated = await prisma.taxCashEntry.update({
    where: { id },
    data: { paymentDate },
  })
  await rebuildCalculatedVat(session.userId)
  await logAudit(session.userId, 'UPDATE', 'TaxCashEntry', id)
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const entry = await prisma.taxCashEntry.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  })
  if (!entry) return NextResponse.json({ error: 'Cash entry not found' }, { status: 404 })

  await prisma.taxCashEntry.delete({ where: { id } })
  await rebuildCalculatedVat(session.userId)
  await logAudit(session.userId, 'DELETE', 'TaxCashEntry', id)
  return NextResponse.json({ success: true })
}
