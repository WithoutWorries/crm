import {
  TaxLiabilitySource,
  TaxLiabilityType,
} from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { optionalString, readJsonObject, requiredString } from '@/lib/request'
import { requireActiveSession } from '@/lib/session'
import { decimalFromCents, parseDateOnly, parseMoneyToCents } from '@/lib/tax'

function includesEnum<T extends string>(values: Record<string, T>, value: unknown): value is T {
  return Object.values(values).includes(value as T)
}

export async function GET() {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const liabilities = await prisma.taxLiability.findMany({
    where: { userId: session.userId },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
  })
  return NextResponse.json(liabilities, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest) {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const body = await readJsonObject(request, 32 * 1024)
  if (body instanceof NextResponse) return body
  const label = requiredString(body.label, { name: 'Label', maxLength: 160 })
  if (label instanceof NextResponse) return label
  const amountCents = parseMoneyToCents(body.amount)
  const dueDate = parseDateOnly(body.dueDate)
  const noticeDate = body.noticeDate ? parseDateOnly(body.noticeDate) : null
  const taxYear = body.taxYear === '' || body.taxYear === null || body.taxYear === undefined
    ? null
    : Number(body.taxYear)

  if (!includesEnum(TaxLiabilityType, body.type) || body.type === 'VAT' && body.source === 'CALCULATED') {
    return NextResponse.json({ error: 'Select a valid liability type' }, { status: 400 })
  }
  if (!includesEnum(TaxLiabilitySource, body.source) || body.source === 'CALCULATED') {
    return NextResponse.json({ error: 'Select Notice, Adviser or Estimate as the source' }, { status: 400 })
  }
  if (amountCents === null || amountCents <= 0 || !dueDate) {
    return NextResponse.json({ error: 'Enter a valid positive amount and due date' }, { status: 400 })
  }
  if (body.noticeDate && !noticeDate) {
    return NextResponse.json({ error: 'Enter a valid notice date' }, { status: 400 })
  }
  if (taxYear !== null && (!Number.isInteger(taxYear) || taxYear < 1990 || taxYear > 2200)) {
    return NextResponse.json({ error: 'Enter a valid tax year' }, { status: 400 })
  }

  const liability = await prisma.taxLiability.create({
    data: {
      userId: session.userId,
      type: body.type,
      source: body.source,
      status: body.source === 'TAX_NOTICE' ? 'NOTICE_RECEIVED' : 'ESTIMATED',
      label,
      amount: decimalFromCents(amountCents),
      dueDate,
      noticeDate,
      taxYear,
      notes: optionalString(body.notes, 2_000),
    },
  })
  await logAudit(session.userId, 'CREATE', 'TaxLiability', liability.id)
  return NextResponse.json(liability, { status: 201 })
}
