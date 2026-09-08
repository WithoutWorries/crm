export type VatFrequency = 'UNKNOWN' | 'MONTHLY' | 'QUARTERLY'

const MAX_AMOUNT_CENTS = 999_999_999_999

export function parseMoneyToCents(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const normalized = String(value).trim().replace(',', '.')
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(normalized)) return null
  const [whole, fraction = ''] = normalized.split('.')
  const cents = Number.parseInt(whole, 10) * 100 + Number.parseInt(fraction.padEnd(2, '0') || '0', 10)
  return Number.isSafeInteger(cents) && cents <= MAX_AMOUNT_CENTS ? cents : null
}

export function parseSignedMoneyToCents(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const normalized = String(value).trim().replace(',', '.')
  if (!/^-?\d{1,10}(?:\.\d{1,2})?$/.test(normalized)) return null
  const negative = normalized.startsWith('-')
  const cents = parseMoneyToCents(negative ? normalized.slice(1) : normalized)
  return cents === null ? null : negative ? -cents : cents
}

export function decimalFromCents(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const absolute = Math.abs(cents)
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, '0')}`
}

export function calculateInvoiceAmounts(netCents: number, vatRate: number) {
  const vatCents = Math.round((netCents * vatRate) / 100)
  return { netCents, vatCents, grossCents: netCents + vatCents }
}

export function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T12:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null
  return date
}

export function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function nextWeekday(date: Date): Date {
  const result = new Date(date)
  while (result.getUTCDay() === 0 || result.getUTCDay() === 6) {
    result.setUTCDate(result.getUTCDate() + 1)
  }
  return result
}

export interface VatPeriod {
  key: string
  label: string
  dueDate: Date
  taxYear: number
}

export function getVatPeriod(
  paymentDate: Date,
  frequency: VatFrequency,
  hasPermanentExtension: boolean
): VatPeriod | null {
  if (frequency === 'UNKNOWN') return null

  const year = paymentDate.getUTCFullYear()
  const month = paymentDate.getUTCMonth()
  let key: string
  let label: string
  let dueYear: number
  let dueMonth: number

  if (frequency === 'MONTHLY') {
    key = `${year}-${String(month + 1).padStart(2, '0')}`
    label = `VAT ${new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(paymentDate)}`
    dueYear = month === 11 ? year + 1 : year
    dueMonth = (month + 1) % 12
  } else {
    const quarter = Math.floor(month / 3) + 1
    key = `${year}-Q${quarter}`
    label = `VAT Q${quarter} ${year}`
    const monthAfterQuarter = quarter * 3
    dueYear = monthAfterQuarter > 11 ? year + 1 : year
    dueMonth = monthAfterQuarter % 12
  }

  if (hasPermanentExtension) {
    dueMonth += 1
    if (dueMonth > 11) {
      dueMonth = 0
      dueYear += 1
    }
  }

  return {
    key,
    label,
    dueDate: nextWeekday(new Date(Date.UTC(dueYear, dueMonth, 10, 12))),
    taxYear: year,
  }
}
