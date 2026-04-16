import { NextResponse } from 'next/server'
import { requireSession, createSessionToken, COOKIE_NAME } from '@/lib/session'

export async function POST() {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  // Re-issue the cookie with a fresh maxAge, sliding the expiry window
  const token = createSessionToken(session.userId, session.role)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return response
}
