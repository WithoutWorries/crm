import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireActiveSession } from '@/lib/session'

export async function GET() {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, lastNotificationReadAt: true },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json(user)
}
