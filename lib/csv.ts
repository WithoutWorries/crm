export function csvCell(value: string | number | null | undefined, protectFormula = true): string {
  let text = value === null || value === undefined ? '' : String(value)
  if (protectFormula && /^[\s]*[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function csvRow(values: Array<string | number | null | undefined>): string {
  return values.map((value) => csvCell(value)).join(',')
}

export function csvAmount(cents: number | null): string {
  return cents === null ? '' : csvCell((cents / 100).toFixed(2), false)
}
