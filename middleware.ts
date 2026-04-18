import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'solo-crm-session'
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/webhook/']

/** Verify HMAC-SHA256 signed session token using Web Crypto (Edge Runtime compatible) */
async function verifySession(token: string, secret: string): Promise<boolean> {
  const parts = token.split('|')
  if (parts.length !== 3) return false
  const [userId, role, sig] = parts
  if (!userId || !role || !sig) return false

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const sigBytes = new Uint8Array(sig.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
  return crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(`${userId}|${role}`))
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

  const valid = await verifySession(token, secret)
  if (!valid) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin-only routes — role is the second segment of the token
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const role = token.split('|')[1]
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
