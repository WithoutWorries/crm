/**
 * Session helpers for Node.js API routes.
 * Cookie format: ${userId}|${role}|${hmac_sha256_hex}
 * The HMAC covers `${userId}|${role}` using SESSION_SECRET.
 */
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const COOKIE_NAME = 'solo-crm-session'

function getSecret(): string {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET env var is not set')
  return s
}

export function createSessionToken(userId: string, role: string): string {
  const payload = `${userId}|${role}`
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
  return `${payload}|${sig}`
}

export function verifySessionToken(token: string): { userId: string; role: string } | null {
  const parts = token.split('|')
  if (parts.length !== 3) return null
  const [userId, role, sig] = parts
  const expected = crypto.createHmac('sha256', getSecret()).update(`${userId}|${role}`).digest('hex')
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null
  } catch {
    return null
  }
  return { userId, role }
}

function parseCookies(header: string): Record<string, string> {
  return Object.fromEntries(
    header.split(';').map((c) => {
      const idx = c.indexOf('=')
      if (idx === -1) return ['', '']
      return [c.slice(0, idx).trim(), c.slice(idx + 1).trim()]
    })
  )
}

export function getSessionFromRequest(request: Request): { userId: string; role: string } | null {
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = parseCookies(cookieHeader)
  const token = cookies[COOKIE_NAME]
  if (!token) return null
  return verifySessionToken(token)
}

/** For use in API route handlers: returns session or a ready-made 401 NextResponse */
export function requireSession(
  request: NextRequest
): { userId: string; role: string } | NextResponse {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  return session
}
