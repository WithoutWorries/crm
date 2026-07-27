import { NextResponse } from 'next/server'
import {
  requireActiveSession,
  createSessionToken,
  COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/session'

export async function POST() {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  // Re-issue the cookie with a fresh maxAge, sliding the expiry window
  const token = createSessionToken(session.userId, session.role)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  })
  return response
}
