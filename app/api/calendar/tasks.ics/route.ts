import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function icalDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function icalDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function icalEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function foldLine(line: string): string {
  const chunks: string[] = []
  while (line.length > 75) {
    chunks.push(line.slice(0, 75))
    line = ' ' + line.slice(75)
  }
  chunks.push(line)
  return chunks.join('\r\n')
}

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: '🔴 HIGH',
  MEDIUM: '🟡 MEDIUM',
  LOW: '🟢 LOW',
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return new NextResponse('Missing token', { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { calendarToken: token },
    select: { id: true, name: true },
  })

  if (!user) {
    return new NextResponse('Invalid token', { status: 401 })
  }

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
    },
    include: {
      contact: { select: { fullName: true } },
      opportunity: { select: { title: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
  })

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SoloCRM//Tasks//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CRM Tasks',
    'X-WR-TIMEZONE:Europe/Berlin',
    'X-WR-CALDESC:Outstanding tasks from your CRM',
  ]

  for (const task of tasks) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : today
    const nextDay = new Date(dueDate.getTime() + 86_400_000)

    const priorityLabel = PRIORITY_LABELS[task.priority] ?? task.priority
    const overdue = task.dueDate && dueDate < today
    const summaryPrefix = overdue ? '⚠️ OVERDUE — ' : ''
    const summary = `${summaryPrefix}${task.title} [${priorityLabel}]`

    const descParts: string[] = []
    if (task.description) descParts.push(task.description)
    if (task.contact) descParts.push(`Contact: ${task.contact.fullName}`)
    if (task.opportunity) descParts.push(`Opportunity: ${task.opportunity.title}`)
    descParts.push(`Status: ${task.status}`)
    if (!task.dueDate) descParts.push('(No due date set — shown on today)')

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:solocrm-task-${task.id}@frasermackie.com`)
    lines.push(`DTSTAMP:${icalDate(now)}`)
    lines.push(`DTSTART;VALUE=DATE:${icalDateOnly(dueDate)}`)
    lines.push(`DTEND;VALUE=DATE:${icalDateOnly(nextDay)}`)
    lines.push(foldLine(`SUMMARY:${icalEscape(summary)}`))
    lines.push(foldLine(`DESCRIPTION:${icalEscape(descParts.join('\\n'))}`))
    lines.push(`LAST-MODIFIED:${icalDate(task.updatedAt)}`)
    lines.push(`STATUS:${task.status === 'IN_PROGRESS' ? 'IN-PROCESS' : 'NEEDS-ACTION'}`)
    if (overdue) {
      lines.push('PRIORITY:1')
    } else if (task.priority === 'HIGH') {
      lines.push('PRIORITY:2')
    }
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  const ical = lines.join('\r\n')

  return new NextResponse(ical, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="crm-tasks.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
