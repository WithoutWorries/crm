import { reconcileRemittance } from './remittance-reconciliation'

export interface TaxEarningsEntry {
  type: 'ISSUED_INVOICE' | 'CLIENT_REMITTANCE' | 'EXPENSE_VAT'
  paymentDate: Date | null
  netCents: number
  vatCents: number
  grossCents: number
  bankedGrossCents: number | null
  cashDiscountRate: number | null
}

export interface EarningsMonth {
  key: string
  label: string
  isCurrent: boolean
  revenueExVatCents: number
  grossCashReceivedCents: number
  businessCostsCents: number
  recordedResultCents: number
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12))
}

function addUtcMonths(date: Date, count: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1, 12))
}

function keyForMonth(date: Date): string {
  return date.toISOString().slice(0, 7)
}

export function summarizeTaxEarnings(
  entries: TaxEarningsEntry[],
  today: Date,
  monthCount = 24
) {
  const currentMonth = startOfUtcMonth(today)
  const historyStart = addUtcMonths(currentMonth, -(monthCount - 1))
  const year = today.getUTCFullYear()
  const values = new Map<string, Omit<EarningsMonth, 'key' | 'label' | 'isCurrent'>>()
  let revenueExVatCents = 0
  let grossCashReceivedCents = 0
  let businessCostsCents = 0
  let unconfirmedCashCount = 0

  for (const entry of entries) {
    if (!entry.paymentDate) continue
    const isExpense = entry.type === 'EXPENSE_VAT'
    const reconciliation = entry.type === 'CLIENT_REMITTANCE'
      ? reconcileRemittance({
          paymentRecorded: true,
          netCents: entry.netCents,
          vatCents: entry.vatCents,
          grossCents: entry.grossCents,
          bankedGrossCents: entry.bankedGrossCents,
          cashDiscountRate: entry.cashDiscountRate,
        })
      : null
    const revenueCents = isExpense ? 0 : (reconciliation?.effectiveNetCents ?? entry.netCents)
    const costsCents = isExpense ? entry.netCents : 0
    const cashCents = isExpense
      ? 0
      : entry.type === 'CLIENT_REMITTANCE'
        ? entry.bankedGrossCents
        : entry.grossCents

    if (entry.paymentDate.getUTCFullYear() === year) {
      revenueExVatCents += revenueCents
      businessCostsCents += costsCents
      grossCashReceivedCents += cashCents ?? 0
      if (entry.type === 'CLIENT_REMITTANCE' && entry.bankedGrossCents === null) {
        unconfirmedCashCount += 1
      }
    }

    const entryMonth = startOfUtcMonth(entry.paymentDate)
    if (entryMonth < historyStart || entryMonth > currentMonth) continue
    const key = keyForMonth(entryMonth)
    const current = values.get(key) ?? {
      revenueExVatCents: 0,
      grossCashReceivedCents: 0,
      businessCostsCents: 0,
      recordedResultCents: 0,
    }
    current.revenueExVatCents += revenueCents
    current.businessCostsCents += costsCents
    current.grossCashReceivedCents += cashCents ?? 0
    current.recordedResultCents = current.revenueExVatCents - current.businessCostsCents
    values.set(key, current)
  }

  const months: EarningsMonth[] = Array.from({ length: monthCount }, (_, index) => {
    const month = addUtcMonths(historyStart, index)
    const key = keyForMonth(month)
    const current = values.get(key) ?? {
      revenueExVatCents: 0,
      grossCashReceivedCents: 0,
      businessCostsCents: 0,
      recordedResultCents: 0,
    }
    return {
      key,
      label: new Intl.DateTimeFormat('en-GB', {
        month: 'short',
        year: '2-digit',
        timeZone: 'UTC',
      }).format(month),
      isCurrent: key === keyForMonth(currentMonth),
      ...current,
    }
  })

  return {
    year,
    revenueExVatCents,
    grossCashReceivedCents,
    businessCostsCents,
    recordedResultCents: revenueExVatCents - businessCostsCents,
    unconfirmedCashCount,
    months,
  }
}
