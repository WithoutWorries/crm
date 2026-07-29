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

/** Verify an expiring HMAC-SHA256 session cookie using Edge-compatible Web Crypto. */
async function verifySession(token: string, secret: string): Promise<{ role: string } | null> {
  const parts = token.split('|')
  if (parts.length !== 5) return null
  const [sessionId, tokenSecret, role, expiresAtValue, sig] = parts
  const expiresAt = Number.parseInt(expiresAtValue, 10)
  if (
    !sessionId ||
    !/^[a-f0-9]{64}$/i.test(tokenSecret) ||
    (role !== 'ADMIN' && role !== 'MEMBER') ||
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
    enc.encode(`${sessionId}|${tokenSecret}|${role}|${expiresAt}`)
  )
  return valid ? { role } : null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isStaticAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/reference-icon.png' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js'

  if (isStaticAsset) return NextResponse.next()

  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const contentLength = Number.parseInt(request.headers.get('content-length') ?? '0', 10)
    if (Number.isFinite(contentLength) && contentLength > 1024 * 1024) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
    }
  }

  // Reject cross-site state changes. Public integrations authenticate separately.
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
    !pathname.startsWith('/api/webhook/')
  ) {
    const origin = request.headers.get('origin')
    const fetchSite = request.headers.get('sec-fetch-site')
    if (
      (origin && origin !== request.nextUrl.origin) ||
      (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite))
    ) {
      return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 })
    }
  }

  if (isPublic) {
    const response = NextResponse.next()
    if (pathname.startsWith('/api/')) response.headers.set('Cache-Control', 'no-store')
    return response
  }

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
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/development')
  ) {
    if (session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  const response = NextResponse.next()
  if (pathname.startsWith('/api/')) response.headers.set('Cache-Control', 'no-store')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
