import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { optionalString, readJsonObject } from '@/lib/request'
import { requireActiveSession } from '@/lib/session'
import { parseWorkSessions } from '@/lib/tax-remittance'
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
  const expectedPaymentDate = body.expectedPaymentDate ? parseDateOnly(body.expectedPaymentDate) : null
  const reference = optionalString(body.reference, 120)
  const netCents = parseMoneyToCents(body.netAmount)
  if (netCents === null) {
    return NextResponse.json({ error: 'Enter a valid net amount' }, { status: 400 })
  }
  if (body.type === 'CLIENT_REMITTANCE' && !documentDate) {
    return NextResponse.json({ error: 'Enter the remittance date' }, { status: 400 })
  }
  if (body.type === 'CLIENT_REMITTANCE' && !reference) {
    return NextResponse.json({ error: 'Enter the document or invoice number from the remittance' }, { status: 400 })
  }
  if (body.paymentDate && !paymentDate) {
    return NextResponse.json({ error: 'Enter a valid payment date' }, { status: 400 })
  }
  if (body.expectedPaymentDate && !expectedPaymentDate) {
    return NextResponse.json({ error: 'Enter a valid expected payment date' }, { status: 400 })
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

  const projectLabel = optionalString(body.projectLabel, 160)
  const parsedSessions = parseWorkSessions(
    body.type === 'CLIENT_REMITTANCE' ? body.workSessions : [],
    session.userId,
    projectLabel
  )
  if (!parsedSessions.ok) {
    return NextResponse.json({ error: parsedSessions.error }, { status: 400 })
  }
  const workSessions = parsedSessions.workSessions

  const sourceFileHash = typeof body.sourceFileHash === 'string' && /^[a-f0-9]{64}$/i.test(body.sourceFileHash)
    ? body.sourceFileHash.toLowerCase()
    : null
  const sourceFileName = optionalString(body.sourceFileName, 240)
  const extractionModel = optionalString(body.extractionModel, 120)
  const aiExtracted = body.type === 'CLIENT_REMITTANCE' && body.aiExtracted === true

  if (aiExtracted && sourceFileHash) {
    const existing = await prisma.taxCashEntry.findFirst({
      where: { userId: session.userId, sourceFileHash },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ error: 'This remittance PDF has already been saved.' }, { status: 409 })
    }
  }

  const entry = await prisma.$transaction(async (tx) => {
    const created = await tx.taxCashEntry.create({
      data: {
        userId: session.userId,
        type: body.type,
        description: optionalString(body.description, 500),
        reference,
        netAmount: decimalFromCents(netCents),
        vatAmount: decimalFromCents(vatCents),
        grossAmount: decimalFromCents(grossCents),
        vatRate,
        documentDate,
        expectedPaymentDate,
        paymentDate,
        clientCalculated: body.type === 'CLIENT_REMITTANCE',
        sourceFileName: aiExtracted ? sourceFileName : null,
        sourceFileHash: aiExtracted ? sourceFileHash : null,
        extractionModel: aiExtracted ? extractionModel : null,
        aiExtracted,
      },
    })
    if (workSessions.length) {
      await tx.workSession.createMany({
        data: workSessions.map((workSession) => ({
          ...workSession,
          taxCashEntryId: created.id,
        })),
      })
    }
    return created
  })

  await rebuildCalculatedVat(session.userId)
  await logAudit(session.userId, 'CREATE', 'TaxCashEntry', entry.id)
  return NextResponse.json(entry, { status: 201 })
}
