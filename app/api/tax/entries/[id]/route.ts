import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { optionalString, readJsonObject } from '@/lib/request'
import { requireActiveSession } from '@/lib/session'
import { decimalFromCents, parseDateOnly, parseMoneyToCents, rebuildCalculatedVat } from '@/lib/tax'
import { parseWorkSessions } from '@/lib/tax-remittance'

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


  const body = await readJsonObject(request, 128 * 1024)
  if (body instanceof NextResponse) return body
  if (body.action === 'updateRemittance') {
    const reference = optionalString(body.reference, 120)
    const documentDate = body.documentDate ? parseDateOnly(body.documentDate) : null
    const expectedPaymentDate = body.expectedPaymentDate ? parseDateOnly(body.expectedPaymentDate) : null
    const paymentDate = body.paymentDate ? parseDateOnly(body.paymentDate) : null
    const netCents = parseMoneyToCents(body.netAmount)
    const vatCents = parseMoneyToCents(body.vatAmount)
    const grossCents = parseMoneyToCents(body.grossAmount)

    if (!reference) {
      return NextResponse.json({ error: 'Enter the document or invoice number from the remittance' }, { status: 400 })
    }
    if (!documentDate) {
      return NextResponse.json({ error: 'Enter a valid remittance date' }, { status: 400 })
    }
    if (body.expectedPaymentDate && !expectedPaymentDate) {
      return NextResponse.json({ error: 'Enter a valid expected payment date' }, { status: 400 })
    }
    if (body.paymentDate && !paymentDate) {
      return NextResponse.json({ error: 'Enter a valid actual payment date' }, { status: 400 })
    }
    if (netCents === null || vatCents === null || grossCents === null) {
      return NextResponse.json({ error: 'Enter valid net, VAT and gross amounts' }, { status: 400 })
    }
    if (Math.abs(netCents + vatCents - grossCents) > 1) {
      return NextResponse.json({ error: 'Net plus VAT must agree with the gross amount' }, { status: 400 })
    }
    if (!Array.isArray(body.workSessions)) {
      return NextResponse.json({ error: 'Work sessions must be supplied when editing a remittance' }, { status: 400 })
    }
    const projectLabel = optionalString(body.projectLabel, 160)
    const parsedSessions = parseWorkSessions(body.workSessions, session.userId, projectLabel)
    if (!parsedSessions.ok) {
      return NextResponse.json({ error: parsedSessions.error }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.taxCashEntry.update({
        where: { id },
        data: {
          reference,
          description: optionalString(body.description, 500),
          documentDate,
          expectedPaymentDate,
          paymentDate,
          netAmount: decimalFromCents(netCents),
          vatAmount: decimalFromCents(vatCents),
          grossAmount: decimalFromCents(grossCents),
        },
      })
      await tx.workSession.deleteMany({
        where: { taxCashEntryId: id, userId: session.userId },
      })
      if (parsedSessions.workSessions.length) {
        await tx.workSession.createMany({
          data: parsedSessions.workSessions.map((workSession) => ({
            ...workSession,
            taxCashEntryId: id,
          })),
        })
      }
      return saved
    })
    await rebuildCalculatedVat(session.userId)
    await logAudit(session.userId, 'UPDATE', 'TaxCashEntry', id)
    return NextResponse.json(updated)
  }
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
