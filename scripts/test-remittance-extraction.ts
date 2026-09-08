import assert from 'node:assert/strict'
import { extractJsonObject, normalizeRemittanceExtraction } from '../lib/remittance-extraction'

const extraction = normalizeRemittanceExtraction({
  documentNumber: '1661198519',
  documentDate: '2026-03-24',
  expectedPaymentDate: '2026-04-21',
  actualPaymentDate: null,
  netAmount: '8.100,00',
  vatAmount: '1.539,00',
  grossAmount: '9.639,00',
  vatRate: 19,
  currency: 'eur',
  billedHours: 90,
  projectLabel: 'February engagement',
  workSessions: Array.from({ length: 18 }, (_, index) => ({
    workDate: `2026-02-${String(index + 2).padStart(2, '0')}`,
    hours: '5,0',
    activity: 'Remote services',
    sourcePage: index < 11 ? 2 : 3,
  })),
})

assert.equal(extraction.netAmount, '8100.00')
assert.equal(extraction.vatAmount, '1539.00')
assert.equal(extraction.grossAmount, '9639.00')
assert.equal(extraction.currency, 'EUR')
assert.equal(extraction.workSessions.length, 18)
assert.equal(extraction.workSessions[0].projectLabel, 'February engagement')
assert.equal(extraction.warnings.length, 0)

const mismatch = normalizeRemittanceExtraction({
  billedHours: 10,
  workSessions: [{ workDate: '2026-02-02', hours: 5 }],
})
assert.match(mismatch.warnings[0], /Daily hours total/)

assert.deepEqual(extractJsonObject('```json\n{"documentNumber":"A1"}\n```'), { documentNumber: 'A1' })
assert.equal(normalizeRemittanceExtraction({ documentDate: '2026-02-29' }).documentDate, null)

console.log('Remittance extraction tests passed')
