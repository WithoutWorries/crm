import { TaxLiabilitySource, TaxPaymentSource } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { optionalString, readJsonObject } from '@/lib/request'
import { requireActiveSession } from '@/lib/session'
import {
  centsFromDecimal,
  decimalFromCents,
  parseDateOnly,
  parseMoneyToCents,
  rebuildCalculatedVat,
} from '@/lib/tax'

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
    if (current.status === 'PAID') {
      return NextResponse.json({ error: 'This liability is already recorded as paid' }, { status: 409 })
    }
    const paidAt = body.paidAt ? parseDateOnly(body.paidAt) : new Date()
    if (!paidAt) return NextResponse.json({ error: 'Enter a valid payment date' }, { status: 400 })
    const advisedCents = parseMoneyToCents(body.advisedAmount)
    const paidCents = parseMoneyToCents(body.paidAmount)
    if (advisedCents === null || advisedCents <= 0) {
      return NextResponse.json({ error: 'Enter the amount advised or filed' }, { status: 400 })
    }
    if (paidCents === null || paidCents <= 0) {
      return NextResponse.json({ error: 'Enter the amount that left the bank' }, { status: 400 })
    }
    if (!includesEnum(TaxPaymentSource, body.paymentSource)) {
      return NextResponse.json({ error: 'Select where the payment amount came from' }, { status: 400 })
    }

    const settlesPeriod = body.settlesPeriod !== false
    const calculatedCents = centsFromDecimal(current.amount)
    if (!settlesPeriod && paidCents >= calculatedCents) {
      return NextResponse.json({
        error: 'A partial payment must be less than the current liability. Mark it as the final payment if it closes the period.',
      }, { status: 400 })
    }
    const periodLabel = optionalString(body.periodLabel, 160) ?? current.label
    const periodKey = optionalString(body.periodKey, 80) ?? current.periodKey
    const notes = optionalString(body.notes, 2_000)
    const { liability, payment } = await prisma.$transaction(async (tx) => {
      const payment = await tx.taxPayment.create({
        data: {
          userId: session.userId,
          taxLiabilityId: id,
          type: current.type,
          periodKey,
          periodLabel,
          calculatedAmount: decimalFromCents(calculatedCents),
          advisedAmount: decimalFromCents(advisedCents),
          paidAmount: decimalFromCents(paidCents),
          paidAt,
          source: body.paymentSource,
          settlesPeriod,
          notes,
        },
      })
      const liability = settlesPeriod
        ? await tx.taxLiability.update({
            where: { id },
            data: { status: 'PAID', paidAt },
          })
        : current.type === 'VAT' && current.source === 'CALCULATED'
          ? current
          : await tx.taxLiability.update({
              where: { id },
              data: { amount: decimalFromCents(calculatedCents - paidCents) },
            })
      return { liability, payment }
    })
    if (current.type === 'VAT') await rebuildCalculatedVat(session.userId)
    await logAudit(session.userId, 'UPDATE', 'TaxLiability', liability.id)
    await logAudit(session.userId, 'CREATE', 'TaxPayment', payment.id)
    return NextResponse.json({ liability, payment })
  }

  if (body.action === 'reopen') {
    const paymentEvidence = await prisma.taxPayment.count({
      where: { userId: session.userId, taxLiabilityId: id, voidedAt: null },
    })
    if (paymentEvidence) {
      return NextResponse.json({ error: 'Void the linked payment record to reopen this liability' }, { status: 409 })
    }
    const liability = await prisma.$transaction(async (tx) => {
      return tx.taxLiability.update({
        where: { id },
        data: {
          status: current.source === 'TAX_NOTICE' ? 'NOTICE_RECEIVED' : 'ESTIMATED',
          paidAt: null,
        },
      })
    })
    if (current.type === 'VAT') await rebuildCalculatedVat(session.userId)
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
  const paymentEvidence = await prisma.taxPayment.count({
    where: { userId: session.userId, taxLiabilityId: id, voidedAt: null },
  })
  if (paymentEvidence) {
    return NextResponse.json({ error: 'Void the linked payment record before removing this liability' }, { status: 409 })
  }

  await prisma.taxLiability.delete({ where: { id } })
  await logAudit(session.userId, 'DELETE', 'TaxLiability', id)
  return NextResponse.json({ success: true })
}
