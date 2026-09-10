export type RemittanceReconciliationStatus =
  | 'PENDING'
  | 'BANK_AMOUNT_UNCONFIRMED'
  | 'MATCHED'
  | 'CASH_DISCOUNT'
  | 'UNEXPLAINED_DIFFERENCE'

export interface RemittanceReconciliation {
  status: RemittanceReconciliationStatus
  bankedGrossCents: number | null
  adjustmentCents: number | null
  effectiveNetCents: number
  effectiveVatCents: number
  effectiveGrossCents: number
}

const MATCH_TOLERANCE_CENTS = 1
const DISCOUNT_TOLERANCE_CENTS = 2

export function parseCashDiscountRate(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const normalized = String(value).trim().replace(',', '.')
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null
  const rate = Number(normalized)
  return Number.isFinite(rate) && rate > 0 && rate <= 100 ? rate : null
}

export function parseCashDiscountDays(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const days = Number(value)
  return Number.isInteger(days) && days >= 1 && days <= 365 ? days : null
}

export function reconcileRemittance(input: {
  paymentRecorded: boolean
  netCents: number
  vatCents: number
  grossCents: number
  bankedGrossCents: number | null
  cashDiscountRate: number | null
}): RemittanceReconciliation {
  const original = {
    effectiveNetCents: input.netCents,
    effectiveVatCents: input.vatCents,
    effectiveGrossCents: input.grossCents,
  }

  if (!input.paymentRecorded) {
    return {
      status: 'PENDING',
      bankedGrossCents: null,
      adjustmentCents: null,
      ...original,
    }
  }

  if (input.bankedGrossCents === null) {
    return {
      status: 'BANK_AMOUNT_UNCONFIRMED',
      bankedGrossCents: null,
      adjustmentCents: null,
      ...original,
    }
  }

  const adjustmentCents = input.grossCents - input.bankedGrossCents
  if (Math.abs(adjustmentCents) <= MATCH_TOLERANCE_CENTS) {
    return {
      status: 'MATCHED',
      bankedGrossCents: input.bankedGrossCents,
      adjustmentCents,
      ...original,
    }
  }

  const expectedDiscountCents = input.cashDiscountRate === null
    ? null
    : Math.round(input.grossCents * input.cashDiscountRate / 100)
  const discountMatches = adjustmentCents > 0 && expectedDiscountCents !== null &&
    Math.abs(adjustmentCents - expectedDiscountCents) <= DISCOUNT_TOLERANCE_CENTS

  if (discountMatches && input.grossCents > 0) {
    const effectiveNetCents = Math.round(
      input.bankedGrossCents * input.netCents / input.grossCents
    )
    return {
      status: 'CASH_DISCOUNT',
      bankedGrossCents: input.bankedGrossCents,
      adjustmentCents,
      effectiveNetCents,
      effectiveVatCents: input.bankedGrossCents - effectiveNetCents,
      effectiveGrossCents: input.bankedGrossCents,
    }
  }

  return {
    status: 'UNEXPLAINED_DIFFERENCE',
    bankedGrossCents: input.bankedGrossCents,
    adjustmentCents,
    ...original,
  }
}
