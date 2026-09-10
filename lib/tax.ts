import {
  Prisma,
  TaxEntryType,
  VatFilingFrequency,
} from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { reconcileRemittance } from '@/lib/remittance-reconciliation'
import { decimalFromCents, getVatPeriod, type VatPeriod } from './tax-calculations'
export {
  calculateInvoiceAmounts,
  decimalFromCents,
  getVatPeriod,
  parseDateOnly,
  parseMoneyToCents,
  parseSignedMoneyToCents,
  toDateOnly,
} from './tax-calculations'

export function centsFromDecimal(value: Prisma.Decimal | number | string): number {
  return Math.round(Number(value) * 100)
}

export async function rebuildCalculatedVat(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const profile = await tx.taxProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })

    const entries = await tx.taxCashEntry.findMany({
      where: { userId },
      select: {
        type: true,
        netAmount: true,
        vatAmount: true,
        grossAmount: true,
        paymentDate: true,
        bankedGrossAmount: true,
        cashDiscountRate: true,
      },
    })

    const totals = new Map<string, { cents: number; period: VatPeriod }>()
    for (const entry of entries) {
      if (!entry.paymentDate) continue
      const period = getVatPeriod(
        entry.paymentDate,
        profile.vatFilingFrequency,
        profile.hasPermanentExtension
      )
      if (!period) continue
      const direction = entry.type === TaxEntryType.EXPENSE_VAT ? -1 : 1
      const vatCents = entry.type === TaxEntryType.CLIENT_REMITTANCE
        ? reconcileRemittance({
            paymentRecorded: true,
            netCents: centsFromDecimal(entry.netAmount),
            vatCents: centsFromDecimal(entry.vatAmount),
            grossCents: centsFromDecimal(entry.grossAmount),
            bankedGrossCents: entry.bankedGrossAmount === null
              ? null
              : centsFromDecimal(entry.bankedGrossAmount),
            cashDiscountRate: entry.cashDiscountRate === null
              ? null
              : Number(entry.cashDiscountRate),
          }).effectiveVatCents
        : centsFromDecimal(entry.vatAmount)
      const existing = totals.get(period.key)
      totals.set(period.key, {
        cents: (existing?.cents ?? 0) + direction * vatCents,
        period,
      })
    }

    await tx.taxLiability.deleteMany({
      where: {
        userId,
        type: 'VAT',
        source: 'CALCULATED',
        status: { not: 'PAID' },
      },
    })

    const paidRows = await tx.taxLiability.findMany({
      where: { userId, type: 'VAT', source: 'CALCULATED', status: 'PAID' },
      select: { periodKey: true, amount: true },
    })
    const paidByPeriod = new Map<string, number>()
    for (const paid of paidRows) {
      if (!paid.periodKey) continue
      paidByPeriod.set(
        paid.periodKey,
        (paidByPeriod.get(paid.periodKey) ?? 0) + centsFromDecimal(paid.amount)
      )
    }

    const liabilities = [...totals.values()]
      .map(({ cents, period }) => {
        const paidCents = paidByPeriod.get(period.key) ?? 0
        const outstandingCents = cents - paidCents
        if (outstandingCents === 0) return null
        return {
          userId,
          type: 'VAT' as const,
          source: 'CALCULATED' as const,
          status: 'ESTIMATED' as const,
          label: paidCents ? `${period.label} adjustment` : period.label,
          amount: decimalFromCents(outstandingCents),
          dueDate: period.dueDate,
          taxYear: period.taxYear,
          periodKey: period.key,
          calculationKey: paidCents ? `vat:${period.key}:outstanding` : `vat:${period.key}`,
        }
      })
      .filter((liability): liability is NonNullable<typeof liability> => liability !== null)

    if (liabilities.length) await tx.taxLiability.createMany({ data: liabilities })
  })
}

export function isTaxEntryType(value: unknown): value is TaxEntryType {
  return Object.values(TaxEntryType).includes(value as TaxEntryType)
}

export function isVatFrequency(value: unknown): value is VatFilingFrequency {
  return Object.values(VatFilingFrequency).includes(value as VatFilingFrequency)
}
