import { NextRequest, NextResponse } from 'next/server'
import { csvAmount, csvRow } from '@/lib/csv'
import { prisma } from '@/lib/prisma'
import { reconcileRemittance } from '@/lib/remittance-reconciliation'
import { centsFromDecimal, toDateOnly } from '@/lib/tax'
import { requireActiveSession } from '@/lib/session'

const STATUS_LABELS = {
  MATCHED: 'Matched in full',
  CASH_DISCOUNT: 'Matched with cash discount',
  UNEXPLAINED_DIFFERENCE: 'Unexplained difference',
  BANK_AMOUNT_UNCONFIRMED: 'Bank amount unconfirmed',
  PENDING: 'Payment pending',
} as const

export async function GET(request: NextRequest) {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const currentYear = new Date().getFullYear()
  const requestedYear = Number(request.nextUrl.searchParams.get('year'))
  const year = Number.isInteger(requestedYear) && requestedYear >= 1990 && requestedYear <= currentYear + 1
    ? requestedYear
    : currentYear
  const start = new Date(Date.UTC(year, 0, 1, 12))
  const end = new Date(Date.UTC(year + 1, 0, 1, 12))

  const entries = await prisma.taxCashEntry.findMany({
    where: {
      userId: session.userId,
      type: { in: ['ISSUED_INVOICE', 'CLIENT_REMITTANCE'] },
      paymentDate: { gte: start, lt: end },
    },
    orderBy: [{ paymentDate: 'asc' }, { createdAt: 'asc' }],
    include: {
      workSessions: { select: { projectLabel: true } },
    },
  })

  const lines = [csvRow([
    'Payment date',
    'Entry type',
    'Document date',
    'Document number',
    'Description',
    'Project',
    'Stated net (EUR)',
    'Stated VAT (EUR)',
    'Stated gross (EUR)',
    'Bank receipt (EUR)',
    'Adjustment (EUR)',
    'Effective net (EUR)',
    'Effective VAT (EUR)',
    'Reconciliation',
    'Cash discount (%)',
    'Cash discount days',
    'Reconciliation note',
  ])]

  for (const entry of entries) {
    const netCents = centsFromDecimal(entry.netAmount)
    const vatCents = centsFromDecimal(entry.vatAmount)
    const grossCents = centsFromDecimal(entry.grossAmount)
    const reconciliation = entry.type === 'CLIENT_REMITTANCE'
      ? reconcileRemittance({
          paymentRecorded: true,
          netCents,
          vatCents,
          grossCents,
          bankedGrossCents: entry.bankedGrossAmount === null
            ? null
            : centsFromDecimal(entry.bankedGrossAmount),
          cashDiscountRate: entry.cashDiscountRate === null
            ? null
            : Number(entry.cashDiscountRate),
        })
      : {
          status: 'MATCHED' as const,
          bankedGrossCents: grossCents,
          adjustmentCents: 0,
          effectiveNetCents: netCents,
          effectiveVatCents: vatCents,
          effectiveGrossCents: grossCents,
        }
    const project = [...new Set(entry.workSessions.map((row) => row.projectLabel).filter(Boolean))].join(' / ')
    lines.push([
      csvRow([
        entry.paymentDate ? toDateOnly(entry.paymentDate) : '',
        entry.type === 'CLIENT_REMITTANCE' ? 'Client remittance' : 'Issued invoice',
        entry.documentDate ? toDateOnly(entry.documentDate) : '',
        entry.reference,
        entry.description,
        project,
      ]),
      csvAmount(netCents),
      csvAmount(vatCents),
      csvAmount(grossCents),
      csvAmount(reconciliation.bankedGrossCents),
      csvAmount(reconciliation.adjustmentCents),
      csvAmount(reconciliation.effectiveNetCents),
      csvAmount(reconciliation.effectiveVatCents),
      csvRow([
        STATUS_LABELS[reconciliation.status],
        entry.cashDiscountRate === null ? '' : Number(entry.cashDiscountRate).toFixed(2),
        entry.cashDiscountDays,
        entry.reconciliationNote,
      ]),
    ].join(','))
  }

  return new NextResponse(`\uFEFF${lines.join('\r\n')}\r\n`, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="income-vat-reconciliation-${year}.csv"`,
      'Content-Type': 'text/csv; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
