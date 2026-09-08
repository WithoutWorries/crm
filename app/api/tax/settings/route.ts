import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { readJsonObject } from '@/lib/request'
import { requireActiveSession } from '@/lib/session'
import {
  decimalFromCents,
  isVatFrequency,
  parseSignedMoneyToCents,
  rebuildCalculatedVat,
} from '@/lib/tax'

export async function GET() {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const profile = await prisma.taxProfile.upsert({
    where: { userId: session.userId },
    update: {},
    create: { userId: session.userId },
  })
  return NextResponse.json(profile, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: NextRequest) {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const body = await readJsonObject(request, 16 * 1024)
  if (body instanceof NextResponse) return body

  const bankBalanceCents = parseSignedMoneyToCents(body.bankBalance)
  const reportingStartYear = Number(body.reportingStartYear)
  const currentYear = new Date().getUTCFullYear()

  if (bankBalanceCents === null) {
    return NextResponse.json({ error: 'Enter a valid bank balance' }, { status: 400 })
  }
  if (!Number.isInteger(reportingStartYear) || reportingStartYear < 1990 || reportingStartYear > currentYear) {
    return NextResponse.json({ error: 'Enter a valid reporting start year' }, { status: 400 })
  }
  if (!isVatFrequency(body.vatFilingFrequency)) {
    return NextResponse.json({ error: 'Select a valid VAT filing frequency' }, { status: 400 })
  }
  if (typeof body.hasPermanentExtension !== 'boolean') {
    return NextResponse.json({ error: 'Invalid permanent-extension setting' }, { status: 400 })
  }

  const profile = await prisma.taxProfile.upsert({
    where: { userId: session.userId },
    update: {
      bankBalance: decimalFromCents(bankBalanceCents),
      reportingStartYear,
      vatFilingFrequency: body.vatFilingFrequency,
      hasPermanentExtension: body.hasPermanentExtension,
    },
    create: {
      userId: session.userId,
      bankBalance: decimalFromCents(bankBalanceCents),
      reportingStartYear,
      vatFilingFrequency: body.vatFilingFrequency,
      hasPermanentExtension: body.hasPermanentExtension,
    },
  })

  await rebuildCalculatedVat(session.userId)
  await logAudit(session.userId, 'UPDATE', 'TaxProfile', profile.id)
  return NextResponse.json(profile)
}
