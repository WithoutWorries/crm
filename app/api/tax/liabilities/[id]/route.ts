import { TaxLiabilitySource } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { optionalString, readJsonObject } from '@/lib/request'
import { requireActiveSession } from '@/lib/session'
import { decimalFromCents, parseDateOnly, parseMoneyToCents } from '@/lib/tax'

function includesEnum<T extends string>(values: Record<string, T>, value: unknown): value is T {
  return Object.values(values).includes(value as T)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const current = await prisma.taxLiability.findFirst({ where: { id, userId: session.userId } })
  if (!current) return NextResponse.json({ error: 'Liability not found' }, { status: 404 })

  const body = await readJsonObject(request, 32 * 1024)
  if (body instanceof NextResponse) return body

  if (body.action === 'markPaid') {
    const paidAt = body.paidAt ? parseDateOnly(body.paidAt) : new Date()
    if (!paidAt) return NextResponse.json({ error: 'Enter a valid payment date' }, { status: 400 })
    const liability = await prisma.taxLiability.update({
      where: { id },
      data: { status: 'PAID', paidAt },
    })
    await logAudit(session.userId, 'UPDATE', 'TaxLiability', liability.id)
    return NextResponse.json(liability)
  }

  if (body.action === 'reopen') {
    const liability = await prisma.taxLiability.update({
      where: { id },
      data: {
        status: current.source === 'TAX_NOTICE' ? 'NOTICE_RECEIVED' : 'ESTIMATED',
        paidAt: null,
      },
    })
    await logAudit(session.userId, 'UPDATE', 'TaxLiability', liability.id)
    return NextResponse.json(liability)
  }

  const amountCents = body.amount === undefined ? null : parseMoneyToCents(body.amount)
  const dueDate = body.dueDate === undefined ? null : parseDateOnly(body.dueDate)
  if (body.amount !== undefined && (amountCents === null || amountCents <= 0)) {
    return NextResponse.json({ error: 'Enter a valid positive amount' }, { status: 400 })
  }
  if (body.dueDate !== undefined && !dueDate) {
    return NextResponse.json({ error: 'Enter a valid due date' }, { status: 400 })
  }
  if (body.source !== undefined && (!includesEnum(TaxLiabilitySource, body.source) || body.source === 'CALCULATED')) {
    return NextResponse.json({ error: 'Select a valid source' }, { status: 400 })
  }

  const liability = await prisma.taxLiability.update({
    where: { id },
    data: {
      ...(amountCents !== null ? { amount: decimalFromCents(amountCents) } : {}),
      ...(dueDate ? { dueDate } : {}),
      ...(body.source !== undefined ? { source: body.source } : {}),
      ...(body.source !== undefined && current.status !== 'PAID'
        ? { status: body.source === 'TAX_NOTICE' ? 'NOTICE_RECEIVED' : 'ESTIMATED' }
        : {}),
      ...(body.label !== undefined ? { label: optionalString(body.label, 160) ?? current.label } : {}),
      ...(body.notes !== undefined ? { notes: optionalString(body.notes, 2_000) } : {}),
    },
  })
  await logAudit(session.userId, 'UPDATE', 'TaxLiability', liability.id)
  return NextResponse.json(liability)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const current = await prisma.taxLiability.findFirst({ where: { id, userId: session.userId } })
  if (!current) return NextResponse.json({ error: 'Liability not found' }, { status: 404 })
  if (current.source === 'CALCULATED') {
    return NextResponse.json({ error: 'Calculated VAT changes when its cash entries change' }, { status: 409 })
  }

  await prisma.taxLiability.delete({ where: { id } })
  await logAudit(session.userId, 'DELETE', 'TaxLiability', id)
  return NextResponse.json({ success: true })
}
