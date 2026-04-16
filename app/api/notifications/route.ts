import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = requireSession(request)
  if (session instanceof NextResponse) return session

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { lastNotificationReadAt: true },
  })

  const since = user?.lastNotificationReadAt ?? new Date(0)

  // Show recent audit log entries by OTHER users
  const recent = await prisma.auditLog.findMany({
    where: { userId: { not: session.userId } },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unreadCount = recent.filter((r: any) => r.createdAt > since).length

  return NextResponse.json({ unreadCount, recent })
}

export async function POST(request: NextRequest) {
  // Mark all as read
  const session = requireSession(request)
  if (session instanceof NextResponse) return session

  await prisma.user.update({
    where: { id: session.userId },
    data: { lastNotificationReadAt: new Date() },
  })
  return NextResponse.json({ success: true })
}
