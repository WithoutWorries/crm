import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import crypto from 'crypto'

function generateToken(): string {
  return crypto.randomBytes(24).toString('hex')
}

export async function GET() {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { calendarToken: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (!user.calendarToken) {
    const token = generateToken()
    await prisma.user.update({
      where: { id: session.userId },
      data: { calendarToken: token },
    })
    return NextResponse.json({ token })
  }

  return NextResponse.json({ token: user.calendarToken })
}

export async function POST() {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  const token = generateToken()
  await prisma.user.update({
    where: { id: session.userId },
    data: { calendarToken: token },
  })
  return NextResponse.json({ token })
}
