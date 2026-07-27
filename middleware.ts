import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'solo-crm-session'
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/webhook/',
  '/api/calendar/tasks.ics',
  '/api/calendar/tasks.json',
  '/api/cron/daily-digest',
]

/** Verify an expiring HMAC-SHA256 session token using Edge-compatible Web Crypto. */
async function verifySession(token: string, secret: string): Promise<{ role: string } | null> {
  const parts = token.split('|')
  if (parts.length !== 4) return null
  const [userId, role, expiresAtValue, sig] = parts
  const expiresAt = Number.parseInt(expiresAtValue, 10)
  if (
    !userId ||
    !role ||
    !sig ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000) ||
    !/^[a-f0-9]{64}$/i.test(sig)
  ) {
    return null
  }

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const sigBytes = new Uint8Array(sig.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes,
    enc.encode(`${userId}|${role}|${expiresAt}`)
  )
  return valid ? { role } : null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isStaticAsset = pathname.startsWith('/_next') || pathname.startsWith('/favicon')

  if (isPublic || isStaticAsset) return NextResponse.next()

  const token = request.cookies.get(COOKIE_NAME)?.value
  const secret = process.env.SESSION_SECRET

  if (!token || !secret) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const session = await verifySession(token, secret)
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin-only routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
