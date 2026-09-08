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

assert.equal(parseMoneyToCents('1234.56'), 123456)
assert.equal(parseMoneyToCents('1234,5'), 123450)
assert.equal(parseMoneyToCents('-1.00'), null)
assert.equal(parseMoneyToCents('1.234'), null)
assert.equal(parseSignedMoneyToCents('-125.40'), -12540)
assert.equal(decimalFromCents(-12540), '-125.40')

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

console.log('Tax calculation tests passed')
