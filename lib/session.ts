/**
 * Session helpers for Next.js API routes (Node.js runtime).
 * Cookie format: ${userId}|${role}|${hmac_sha256_hex}
 */
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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
  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(`${userId}|${role}`)
    .digest('hex')
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null
  } catch {
    return null
  }
  return { userId, role }
}

/**
 * Read the session from the incoming request using Next.js cookies() API.
 * Use this in all API route handlers.
 */
export function getSession(): { userId: string; role: string } | null {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/**
 * Returns session or a ready-made 401 NextResponse.
 * Pattern: const session = requireSession(); if (session instanceof NextResponse) return session;
 */
export function requireSession(): { userId: string; role: string } | NextResponse {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  return session
}
