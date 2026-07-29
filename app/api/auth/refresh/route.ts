import { NextResponse } from 'next/server'
import {
  requireActiveSession,
  refreshSession,
  setSessionCookie,
} from '@/lib/session'

export async function POST() {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const token = await refreshSession(session.sessionId, session.role)
  if (!token) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const response = NextResponse.json({ ok: true })
  setSessionCookie(response, token)
  return response
}
