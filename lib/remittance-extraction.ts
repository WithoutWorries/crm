import { parseDateOnly, parseMoneyToCents } from './tax-calculations'

export interface ExtractedWorkSession {
  workDate: string
  hours: string
  activity: string | null
  projectLabel: string | null
  sourcePage: number | null
}

export interface RemittanceExtraction {
  documentNumber: string | null
  documentDate: string | null
  expectedPaymentDate: string | null
  actualPaymentDate: string | null
  description: string | null
  clientName: string | null
  projectLabel: string | null
  netAmount: string | null
  vatAmount: string | null
  grossAmount: string | null
  vatRate: number | null
  currency: string
  billedHours: string | null
  workSessions: ExtractedWorkSession[]
  warnings: string[]
}

function textOrNull(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  return value.trim().slice(0, maxLength) || null
}

function dateOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const valueDate = parseDateOnly(value.trim())
  return valueDate ? valueDate.toISOString().slice(0, 10) : null
}

function decimalOrNull(value: unknown, maximum: number): string | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  let normalized = String(value).trim().replace(/\s/g, '')
  if (/^\d{1,3}(\.\d{3})*,\d+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else if (/^\d+,\d+$/.test(normalized)) {
    normalized = normalized.replace(',', '.')
  }
  const number = Number(normalized)
  if (!Number.isFinite(number) || number < 0 || number > maximum) return null
  return number.toFixed(2)
}

function pageOrNull(value: unknown): number | null {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 && page <= 600 ? page : null
}

export function normalizeRemittanceExtraction(value: unknown): RemittanceExtraction {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
  const defaultProject = textOrNull(source.projectLabel, 160)
  const sessions = Array.isArray(source.workSessions) ? source.workSessions : []
  const workSessions = sessions.slice(0, 600).flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const row = item as Record<string, unknown>
    const workDate = dateOrNull(row.workDate)
    const hours = decimalOrNull(row.hours, 24)
    if (!workDate || !hours || Number(hours) <= 0) return []
    return [{
      workDate,
      hours,
      activity: textOrNull(row.activity, 240),
      projectLabel: textOrNull(row.projectLabel, 160) ?? defaultProject,
      sourcePage: pageOrNull(row.sourcePage),
    }]
  })

  const warnings = Array.isArray(source.warnings)
    ? source.warnings.flatMap((warning) => {
        const text = textOrNull(warning, 240)
        return text ? [text] : []
      }).slice(0, 12)
    : []

  const netAmount = decimalOrNull(source.netAmount, 100_000_000)
  const vatAmount = decimalOrNull(source.vatAmount, 100_000_000)
  const grossAmount = decimalOrNull(source.grossAmount, 100_000_000)
  const billedHours = decimalOrNull(source.billedHours, 100_000)
  const vatRateNumber = Number(source.vatRate)
  const vatRate = Number.isFinite(vatRateNumber) && vatRateNumber >= 0 && vatRateNumber <= 100
    ? vatRateNumber
    : null

  if (netAmount && vatAmount && grossAmount) {
    const expectedGross = (parseMoneyToCents(netAmount) ?? 0) + (parseMoneyToCents(vatAmount) ?? 0)
    const suppliedGross = parseMoneyToCents(grossAmount) ?? 0
    if (Math.abs(expectedGross - suppliedGross) > 1) {
      warnings.push('Net plus VAT does not agree with the gross amount. Check the document before saving.')
    }
  }

  if (billedHours && workSessions.length) {
    const extractedHours = workSessions.reduce((total, row) => total + Number(row.hours), 0)
    if (Math.abs(extractedHours - Number(billedHours)) > 0.01) {
      warnings.push(`Daily hours total ${extractedHours.toFixed(2)}, but the billed quantity is ${Number(billedHours).toFixed(2)}.`)
    }
  }

  const currency = textOrNull(source.currency, 3)?.toUpperCase() || 'EUR'
  return {
    documentNumber: textOrNull(source.documentNumber, 120),
    documentDate: dateOrNull(source.documentDate),
    expectedPaymentDate: dateOrNull(source.expectedPaymentDate),
    actualPaymentDate: dateOrNull(source.actualPaymentDate),
    description: textOrNull(source.description, 500),
    clientName: textOrNull(source.clientName, 160),
    projectLabel: defaultProject,
    netAmount,
    vatAmount,
    grossAmount,
    vatRate,
    currency: /^[A-Z]{3}$/.test(currency) ? currency : 'EUR',
    billedHours,
    workSessions,
    warnings: [...new Set(warnings)],
  }
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1]
  const candidate = fenced ?? trimmed
  try {
    return JSON.parse(candidate)
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start < 0 || end <= start) throw new Error('Claude did not return structured remittance data')
    return JSON.parse(candidate.slice(start, end + 1))
  }
}
