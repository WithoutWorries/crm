import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { optionalString, readJsonObject } from '@/lib/request'
import { requireActiveSession } from '@/lib/session'
import {
  calculateInvoiceAmounts,
  decimalFromCents,
  isTaxEntryType,
  parseDateOnly,
  parseMoneyToCents,
  rebuildCalculatedVat,
} from '@/lib/tax'

const VAT_RATES = new Set([0, 7, 19])

export async function GET() {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const entries = await prisma.taxCashEntry.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(entries, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest) {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const body = await readJsonObject(request, 32 * 1024)
  if (body instanceof NextResponse) return body
  if (!isTaxEntryType(body.type)) {
    return NextResponse.json({ error: 'Select a valid entry type' }, { status: 400 })
  }

  const paymentDate = body.paymentDate ? parseDateOnly(body.paymentDate) : null
  const documentDate = body.documentDate ? parseDateOnly(body.documentDate) : null
  const netCents = parseMoneyToCents(body.netAmount)
  if (netCents === null) {
    return NextResponse.json({ error: 'Enter a valid net amount' }, { status: 400 })
  }
  if (body.type === 'CLIENT_REMITTANCE' && !documentDate) {
    return NextResponse.json({ error: 'Enter the remittance date' }, { status: 400 })
  }
  if (body.paymentDate && !paymentDate) {
    return NextResponse.json({ error: 'Enter a valid payment date' }, { status: 400 })
  }
  if (body.type !== 'CLIENT_REMITTANCE' && !paymentDate) {
    return NextResponse.json({ error: 'Enter the date the payment reached the bank' }, { status: 400 })
  }

  let vatCents: number
  let grossCents: number
  let vatRate: number | null = null

  if (body.type === 'ISSUED_INVOICE') {
    vatRate = Number(body.vatRate)
    if (!VAT_RATES.has(vatRate)) {
      return NextResponse.json({ error: 'VAT rate must be 0%, 7% or 19%' }, { status: 400 })
    }
    const calculated = calculateInvoiceAmounts(netCents, vatRate)
    vatCents = calculated.vatCents
    grossCents = calculated.grossCents
  } else {
    const suppliedVat = parseMoneyToCents(body.vatAmount)
    if (suppliedVat === null) {
      return NextResponse.json({ error: 'Enter a valid VAT amount' }, { status: 400 })
    }
    vatCents = suppliedVat
    grossCents = netCents + vatCents

    if (body.type === 'CLIENT_REMITTANCE') {
      const suppliedGross = parseMoneyToCents(body.grossAmount)
      if (suppliedGross === null || Math.abs(suppliedGross - grossCents) > 1) {
        return NextResponse.json(
          { error: 'Net plus VAT must agree with the client-calculated gross amount' },
          { status: 400 }
        )
      }
      grossCents = suppliedGross
    }
  }

  const entry = await prisma.taxCashEntry.create({
    data: {
      userId: session.userId,
      type: body.type,
      description: optionalString(body.description, 500),
      reference: optionalString(body.reference, 120),
      netAmount: decimalFromCents(netCents),
      vatAmount: decimalFromCents(vatCents),
      grossAmount: decimalFromCents(grossCents),
      vatRate,
      documentDate,
      paymentDate,
      clientCalculated: body.type === 'CLIENT_REMITTANCE',
    },
  })

  await rebuildCalculatedVat(session.userId)
  await logAudit(session.userId, 'CREATE', 'TaxCashEntry', entry.id)
  return NextResponse.json(entry, { status: 201 })
}
