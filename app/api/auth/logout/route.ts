import { NextResponse } from 'next/server'
import { clearSessionCookie, getSession, revokeSession } from '@/lib/session'

export async function POST() {
  const session = await getSession()
  if (session) await revokeSession(session.sessionId)
  const response = NextResponse.json({ success: true })
  clearSessionCookie(response)
  response.cookies.set('solo-crm-auth', '', { expires: new Date(0), path: '/' })
  return response
}
