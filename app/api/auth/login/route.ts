import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword } from '@/lib/auth'
import { createSessionToken, COOKIE_NAME } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    if (!user || !user.isActive) {
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
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = createSessionToken(user.id, user.role)
    const response = NextResponse.json({ success: true, name: user.name, role: user.role })

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    response.cookies.set('solo-crm-auth', '', { expires: new Date(0), path: '/' })

    return response
  } catch (error) {
    console.error('[LOGIN_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
