import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_MAX_JSON_BYTES = 256 * 1024

// Route handlers progressively add field-level validation. Keep the parsed
// shape compatible with the existing handlers while centrally enforcing JSON,
// object-only payloads and a hard byte limit.
export type JsonObject = Record<string, any>

export async function readJsonObject(
  request: NextRequest,
  maxBytes = DEFAULT_MAX_JSON_BYTES
): Promise<JsonObject | NextResponse> {
  const contentType = request.headers.get('content-type')?.toLowerCase() || ''
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Expected a JSON request' }, { status: 415 })
  }

  const declaredLength = Number.parseInt(request.headers.get('content-length') || '', 10)
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return NextResponse.json({ error: 'Request is too large' }, { status: 413 })
  }

  let text: string
  try {
    text = await request.text()
  } catch {
    return NextResponse.json({ error: 'Unable to read request' }, { status: 400 })
  }

  if (Buffer.byteLength(text, 'utf8') > maxBytes) {
    return NextResponse.json({ error: 'Request is too large' }, { status: 413 })
  }

  try {
    const value = JSON.parse(text)
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return NextResponse.json({ error: 'Expected a JSON object' }, { status: 400 })
    }
    return value as JsonObject
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}

export function requiredString(
  value: unknown,
  options: { name: string; maxLength?: number; minLength?: number }
): string | NextResponse {
  const normalized = typeof value === 'string' ? value.trim() : ''
  const minLength = options.minLength ?? 1
  const maxLength = options.maxLength ?? 500
  if (normalized.length < minLength || normalized.length > maxLength) {
    return NextResponse.json(
      {
        error: `${options.name} must be between ${minLength} and ${maxLength} characters`,
      },
      { status: 400 }
    )
  }
  return normalized
}

export function optionalString(value: unknown, maxLength = 10_000): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return null
  return value.trim().slice(0, maxLength) || null
}
