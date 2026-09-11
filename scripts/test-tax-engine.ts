import assert from 'node:assert/strict'
import {
  calculateInvoiceAmounts,
  decimalFromCents,
  getVatPeriod,
  parseDateOnly,
  parseMoneyToCents,
  parseSignedMoneyToCents,
  toDateOnly,
} from '../lib/tax-calculations'
import { csvCell } from '../lib/csv'
import { reconcileRemittance } from '../lib/remittance-reconciliation'
import { summarizeTaxEarnings } from '../lib/tax-earnings'

assert.equal(parseMoneyToCents('1234.56'), 123456)
assert.equal(parseMoneyToCents('1234,5'), 123450)
assert.equal(parseMoneyToCents('-1.00'), null)
assert.equal(parseMoneyToCents('1.234'), null)
assert.equal(parseSignedMoneyToCents('-125.40'), -12540)
assert.equal(decimalFromCents(-12540), '-125.40')

const discounted = reconcileRemittance({
  paymentRecorded: true,
  netCents: 1_470_735,
  vatCents: 279_440,
  grossCents: 1_750_175,
  bankedGrossCents: 1_723_922,
  cashDiscountRate: 1.5,
})
assert.deepEqual(discounted, {
  status: 'CASH_DISCOUNT',
  bankedGrossCents: 1_723_922,
  adjustmentCents: 26_253,
  effectiveNetCents: 1_448_674,
  effectiveVatCents: 275_248,
  effectiveGrossCents: 1_723_922,
})

assert.equal(reconcileRemittance({
  paymentRecorded: true,
  netCents: 100_00,
  vatCents: 19_00,
  grossCents: 119_00,
  bankedGrossCents: 118_00,
  cashDiscountRate: null,
}).status, 'UNEXPLAINED_DIFFERENCE')
assert.equal(reconcileRemittance({
  paymentRecorded: true,
  netCents: 100_00,
  vatCents: 19_00,
  grossCents: 119_00,
  bankedGrossCents: null,
  cashDiscountRate: null,
}).status, 'BANK_AMOUNT_UNCONFIRMED')
assert.equal(csvCell('=HYPERLINK("unsafe")'), '"\'=HYPERLINK(""unsafe"")"')

assert.deepEqual(calculateInvoiceAmounts(100005, 19), {
  netCents: 100005,
  vatCents: 19001,
  grossCents: 119006,
})

const q3 = getVatPeriod(new Date('2026-08-15T12:00:00.000Z'), 'QUARTERLY', false)
assert.equal(q3?.key, '2026-Q3')
assert.equal(q3?.label, 'VAT Q3 2026')
assert.equal(q3 && toDateOnly(q3.dueDate), '2026-10-12')

const extendedQ3 = getVatPeriod(new Date('2026-08-15T12:00:00.000Z'), 'QUARTERLY', true)
assert.equal(extendedQ3 && toDateOnly(extendedQ3.dueDate), '2026-11-10')

const december = getVatPeriod(new Date('2026-12-20T12:00:00.000Z'), 'MONTHLY', false)
assert.equal(december?.key, '2026-12')
assert.equal(december && toDateOnly(december.dueDate), '2027-01-11')
assert.equal(getVatPeriod(new Date(), 'UNKNOWN', false), null)

assert.equal(parseDateOnly('2026-02-29'), null)
assert.equal(parseDateOnly('2024-02-29')?.toISOString().slice(0, 10), '2024-02-29')

const earnings = summarizeTaxEarnings([
  {
    type: 'CLIENT_REMITTANCE',
    paymentDate: new Date('2026-08-05T12:00:00.000Z'),
    netCents: 1_470_735,
    vatCents: 279_440,
    grossCents: 1_750_175,
    bankedGrossCents: 1_723_922,
    cashDiscountRate: 1.5,
  },
  {
    type: 'EXPENSE_VAT',
    paymentDate: new Date('2026-08-08T12:00:00.000Z'),
    netCents: 100_000,
    vatCents: 19_000,
    grossCents: 119_000,
    bankedGrossCents: null,
    cashDiscountRate: null,
  },
  {
    type: 'CLIENT_REMITTANCE',
    paymentDate: new Date('2026-09-01T12:00:00.000Z'),
    netCents: 200_000,
    vatCents: 38_000,
    grossCents: 238_000,
    bankedGrossCents: null,
    cashDiscountRate: null,
  },
], new Date('2026-09-11T12:00:00.000Z'))

assert.equal(earnings.revenueExVatCents, 1_648_674)
assert.equal(earnings.grossCashReceivedCents, 1_723_922)
assert.equal(earnings.businessCostsCents, 100_000)
assert.equal(earnings.recordedResultCents, 1_548_674)
assert.equal(earnings.unconfirmedCashCount, 1)
assert.deepEqual(earnings.sources, {
  issuedInvoiceRevenueCents: 0,
  clientRemittanceRevenueCents: 1_648_674,
  issuedInvoiceCount: 0,
  clientRemittanceCount: 2,
  businessCostCount: 1,
})
assert.equal(earnings.months.length, 24)
assert.deepEqual(earnings.months.at(-2), {
  key: '2026-08',
  label: 'Aug 26',
  isCurrent: false,
  revenueExVatCents: 1_448_674,
  grossCashReceivedCents: 1_723_922,
  businessCostsCents: 100_000,
  recordedResultCents: 1_348_674,
})

console.log('Tax calculation tests passed')
