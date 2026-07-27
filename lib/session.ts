/**
 * Session helpers for Next.js API routes (Node.js runtime).
 * Cookie format: ${userId}|${role}|${expiresAtUnix}|${hmac_sha256_hex}
 */
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const COOKIE_NAME = 'solo-crm-session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

function getSecret(): string {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET env var is not set')
  return s
}

export function createSessionToken(userId: string, role: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  const payload = `${userId}|${role}|${expiresAt}`
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
  return `${payload}|${sig}`
}

export function verifySessionToken(token: string): { userId: string; role: string } | null {
  const parts = token.split('|')
  if (parts.length !== 4) return null
  const [userId, role, expiresAtValue, sig] = parts
  const expiresAt = Number.parseInt(expiresAtValue, 10)
  if (!userId || !role || !Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return null
  }

  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(`${userId}|${role}|${expiresAt}`)
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

/**
 * Use for private or security-sensitive routes. In addition to verifying the
 * signed token, this checks that the account still exists and is active, and
 * refreshes the role from the database rather than trusting a stale cookie.
 */
export async function requireActiveSession(): Promise<
  { userId: string; role: string } | NextResponse
> {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const user = await prisma.user.findFirst({
    where: { id: session.userId, isActive: true },
    select: { id: true, role: true },
  })

  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  return { userId: user.id, role: user.role }
}
