import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireActiveSession } from '@/lib/session'
import { hashPassword } from '@/lib/auth'
import { readJsonObject } from '@/lib/request'

export async function GET(_request: NextRequest) {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await prisma.user.findMany({
    where: { workspaceId: session.workspaceId },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await readJsonObject(request, 16 * 1024)
    if (body instanceof NextResponse) return body
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : null
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const role = body.role
    if (!email || email.length > 320 || password.length < 12 || password.length > 1_024) {
      return NextResponse.json(
        { error: 'A valid email and password of at least 12 characters are required' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

    const user = await prisma.user.create({
      data: {
        workspaceId: session.workspaceId,
        name,
        email,
        passwordHash: hashPassword(password),
        role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('[ADMIN_CREATE_USER_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
