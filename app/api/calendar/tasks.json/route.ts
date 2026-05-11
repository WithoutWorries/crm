import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { calendarToken: token },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const tasks = await prisma.task.findMany({
    where: { userId: user.id, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    select: {
      id: true, title: true, priority: true, status: true, dueDate: true,
      contact: { select: { fullName: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { priority: 'asc' }, { createdAt: 'asc' }],
  })

  const now = new Date()
  return NextResponse.json(tasks.map(t => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.status,
    dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
    overdue: t.dueDate ? t.dueDate < now : false,
    contact: t.contact?.fullName ?? null,
  })))
}
