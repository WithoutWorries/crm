import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword, passwordNeedsUpgrade } from '@/lib/auth'
import { createSession, setSessionCookie } from '@/lib/session'
import {
  getClientIp,
  isLoginBlocked,
  recordLoginFailure,
  recordLoginSuccess,
} from '@/lib/security'
import { readJsonObject } from '@/lib/request'

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request, 16 * 1024)
    if (body instanceof NextResponse) return body
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const ipAddress = getClientIp(request)
    const userAgent = request.headers.get('user-agent')

    if (!email || !password || email.length > 320 || password.length > 1_024) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (await isLoginBlocked(email, ipAddress)) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Try again in 15 minutes.' },
        { status: 429, headers: { 'Retry-After': '900', 'Cache-Control': 'no-store' } }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) {
      await recordLoginFailure(email, ipAddress)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    let authenticated = false

    if (user.passwordHash) {
      authenticated = verifyPassword(password, user.passwordHash)
    } else {
      // Migration path: if no hash yet, accept AUTH_PASSWORD env var
      const fallback = process.env.AUTH_PASSWORD
      if (fallback && password === fallback) {
        authenticated = true
        const hash = hashPassword(password)
        await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } })
      }
    }

    if (!authenticated) {
      await recordLoginFailure(email, ipAddress, user.id)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (user.passwordHash && passwordNeedsUpgrade(user.passwordHash)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(password) },
      })
    }

    const token = await createSession(user.id, user.role, { ipAddress, userAgent })
    const response = NextResponse.json({ success: true, name: user.name, role: user.role })
    setSessionCookie(response, token)

    response.cookies.set('solo-crm-auth', '', { expires: new Date(0), path: '/' })

    await recordLoginSuccess(email, ipAddress, user.id, userAgent)

    return response
  } catch (error) {
    console.error('[LOGIN_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
