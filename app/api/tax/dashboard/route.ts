import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireActiveSession } from '@/lib/session'
import { centsFromDecimal, getVatPeriod, toDateOnly } from '@/lib/tax'

const DAY_MS = 24 * 60 * 60 * 1000

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7)
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12))
}

function addUtcMonths(date: Date, count: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1, 12))
}

function daysFromToday(date: Date, today: Date): number {
  return Math.ceil((date.getTime() - today.getTime()) / DAY_MS)
}

function displayStatus(status: string, dueDate: Date, today: Date) {
  if (status === 'PAID') return 'PAID'
  const days = daysFromToday(dueDate, today)
  if (days < 0) return 'OVERDUE'
  if (days <= 7) return 'URGENT'
  if (days <= 30) return 'DUE_SOON'
  return status
}

export async function GET() {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const profile = await prisma.taxProfile.upsert({
    where: { userId: session.userId },
    update: {},
    create: { userId: session.userId },
  })

  const [liabilityRows, entryRows] = await Promise.all([
    prisma.taxLiability.findMany({
      where: { userId: session.userId },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.taxCashEntry.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { _count: { select: { workSessions: true } } },
    }),
  ])

  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12))
  const timelineStart = addUtcMonths(startOfUtcMonth(today), -3)
  const timelineEnd = addUtcMonths(timelineStart, 12)

  const serializedLiabilities = liabilityRows.map((liability) => ({
    id: liability.id,
    label: liability.label,
    type: liability.type,
    source: liability.source,
    status: liability.status,
    displayStatus: displayStatus(liability.status, liability.dueDate, today),
    amountCents: centsFromDecimal(liability.amount),
    dueDate: toDateOnly(liability.dueDate),
    noticeDate: liability.noticeDate ? toDateOnly(liability.noticeDate) : null,
    paidAt: liability.paidAt ? toDateOnly(liability.paidAt) : null,
    taxYear: liability.taxYear,
    periodKey: liability.periodKey,
    notes: liability.notes,
  }))

  const unpaid = serializedLiabilities.filter((item) => item.status !== 'PAID' && item.amountCents > 0)
  const vatReserveCents = unpaid
    .filter((item) => item.type === 'VAT')
    .reduce((total, item) => total + item.amountCents, 0)
  const nonIncomeKnownReserveCents = unpaid
    .filter((item) => item.type === 'PRIOR_YEAR_SETTLEMENT' || item.type === 'OTHER')
    .reduce((total, item) => total + item.amountCents, 0)
  const nextIncomeTax = unpaid
    .filter((item) => item.type === 'INCOME_TAX_PREPAYMENT')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
  const reservedCents = vatReserveCents + nonIncomeKnownReserveCents + (nextIncomeTax?.amountCents ?? 0)
  const bankBalanceCents = centsFromDecimal(profile.bankBalance)

  const knownVat = serializedLiabilities.filter((item) => item.type === 'VAT')
  const calculatedVatAmounts = knownVat
    .filter((item) => item.source === 'CALCULATED' && item.amountCents > 0)
    .map((item) => item.amountCents)
  const projectedVatCents = calculatedVatAmounts.length
    ? Math.round(calculatedVatAmounts.reduce((sum, amount) => sum + amount, 0) / calculatedVatAmounts.length)
    : 0

  const projectedVatByMonth = new Map<string, { label: string; amountCents: number }>()
  if (profile.vatFilingFrequency !== 'UNKNOWN' && projectedVatCents > 0) {
    const knownVatPeriods = new Set(knownVat.map((item) => item.periodKey).filter(Boolean))
    for (let index = 0; index < 18; index += 1) {
      const candidate = addUtcMonths(startOfUtcMonth(today), index)
      const period = getVatPeriod(
        candidate,
        profile.vatFilingFrequency,
        profile.hasPermanentExtension
      )
      if (
        period &&
        period.dueDate >= today &&
        period.dueDate < timelineEnd &&
        !knownVatPeriods.has(period.key)
      ) {
        projectedVatByMonth.set(monthKey(period.dueDate), {
          label: `${period.label} projection`,
          amountCents: projectedVatCents,
        })
      }
    }
  }

  const timeline = Array.from({ length: 12 }, (_, index) => {
    const month = addUtcMonths(timelineStart, index)
    const key = monthKey(month)
    const items = serializedLiabilities.filter((item) => item.dueDate.startsWith(key))
    const projected = projectedVatByMonth.get(key) ?? null
    return {
      key,
      label: new Intl.DateTimeFormat('en-GB', {
        month: 'short',
        year: '2-digit',
        timeZone: 'UTC',
      }).format(month),
      isPast: month < startOfUtcMonth(today),
      isCurrent: key === monthKey(today),
      knownCents: items.reduce((sum, item) => sum + Math.max(item.amountCents, 0), 0),
      projectedCents: projected?.amountCents ?? 0,
      items: items.map((item) => ({
        id: item.id,
        label: item.label,
        type: item.type,
        amountCents: item.amountCents,
        dueDate: item.dueDate,
        status: item.status,
        displayStatus: item.displayStatus,
      })),
      projectionLabel: projected?.label ?? null,
    }
  })

  const urgent = unpaid
    .filter((item) => daysFromToday(new Date(`${item.dueDate}T12:00:00.000Z`), today) <= 7)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const recentEntries = entryRows.map((entry) => ({
    id: entry.id,
    type: entry.type,
    description: entry.description,
    reference: entry.reference,
    netCents: centsFromDecimal(entry.netAmount),
    vatCents: centsFromDecimal(entry.vatAmount),
    grossCents: centsFromDecimal(entry.grossAmount),
    vatRate: entry.vatRate,
    documentDate: entry.documentDate ? toDateOnly(entry.documentDate) : null,
    expectedPaymentDate: entry.expectedPaymentDate ? toDateOnly(entry.expectedPaymentDate) : null,
    paymentDate: entry.paymentDate ? toDateOnly(entry.paymentDate) : null,
    clientCalculated: entry.clientCalculated,
    aiExtracted: entry.aiExtracted,
    workSessionCount: entry._count.workSessions,
  }))

  return NextResponse.json(
    {
      profile: {
        bankBalanceCents,
        currency: profile.currency,
        reportingStartYear: profile.reportingStartYear,
        vatFilingFrequency: profile.vatFilingFrequency,
        hasPermanentExtension: profile.hasPermanentExtension,
      },
      metrics: {
        bankBalanceCents,
        reservedCents,
        safeToSpendCents: bankBalanceCents - reservedCents,
        vatReserveCents,
        nextIncomeTaxCents: nextIncomeTax?.amountCents ?? 0,
      },
      urgent,
      timeline,
      liabilities: serializedLiabilities,
      recentEntries,
      calculationNote:
        'Planning estimate only. Confirm filing periods, due dates and assessed amounts with your Steuerberater or tax notice.',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
