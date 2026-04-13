import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isStaticAsset = pathname.startsWith('/_next') || pathname.startsWith('/favicon')

  if (isPublic || isStaticAsset) return NextResponse.next()

  const auth = request.cookies.get('solo-crm-auth')?.value
  if (auth === 'authenticated') return NextResponse.next()

  const loginUrl = new URL('/login', request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
