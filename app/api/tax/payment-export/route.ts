import { NextRequest, NextResponse } from 'next/server'
import { csvAmount, csvRow } from '@/lib/csv'
import { prisma } from '@/lib/prisma'
import { requireActiveSession } from '@/lib/session'
import { centsFromDecimal, toDateOnly } from '@/lib/tax'

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

  const payments = await prisma.taxPayment.findMany({
    where: {
      userId: session.userId,
      voidedAt: null,
      paidAt: { gte: start, lt: end },
    },
    orderBy: [{ paidAt: 'asc' }, { createdAt: 'asc' }],
  })

  const lines = [csvRow([
    'Payment date',
    'Liability type',
    'Tax period / description',
    'Period key',
    'App calculation (EUR)',
    'Advised or filed (EUR)',
    'Paid by bank (EUR)',
    'Advice less app (EUR)',
    'Bank less advice (EUR)',
    'Evidence source',
    'Settlement',
    'Notes',
  ])]

  for (const payment of payments) {
    const calculatedCents = centsFromDecimal(payment.calculatedAmount)
    const advisedCents = centsFromDecimal(payment.advisedAmount)
    const paidCents = centsFromDecimal(payment.paidAmount)
    lines.push([
      csvRow([
        toDateOnly(payment.paidAt),
        payment.type,
        payment.periodLabel,
        payment.periodKey,
      ]),
      csvAmount(calculatedCents),
      csvAmount(advisedCents),
      csvAmount(paidCents),
      csvAmount(advisedCents - calculatedCents),
      csvAmount(paidCents - advisedCents),
      csvRow([
        payment.source,
        payment.settlesPeriod ? 'Final / period settled' : 'Partial payment',
        payment.notes,
      ]),
    ].join(','))
  }

  return new NextResponse(`\uFEFF${lines.join('\r\n')}\r\n`, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="tax-payments-${year}.csv"`,
      'Content-Type': 'text/csv; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
