import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'

export async function GET() {
  const session = requireSession()
  if (session instanceof NextResponse) return session
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const [
      users,
      companies,
      contacts,
      opportunities,
      tasks,
      activities,
      notes,
      auditLogs,
      loginRecords,
      tags,
      companyTags,
      contactTags,
      opportunityTags,
      opportunityContacts,
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true, name: true, email: true, role: true,
          isActive: true, createdAt: true, lastNotificationReadAt: true,
          // passwordHash intentionally excluded from backup
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.company.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.contact.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.opportunity.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.task.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.activity.findMany({ orderBy: { happenedAt: 'asc' } }),
      prisma.note.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.loginRecord.findMany({ orderBy: { loginAt: 'asc' } }),
      prisma.tag.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.companyTag.findMany(),
      prisma.contactTag.findMany(),
      prisma.opportunityTag.findMany(),
      prisma.opportunityContact.findMany(),
    ])

    const backup = {
      exportedAt: new Date().toISOString(),
      schemaVersion: '4.0',
      counts: {
        users: users.length,
        companies: companies.length,
        contacts: contacts.length,
        opportunities: opportunities.length,
        tasks: tasks.length,
        activities: activities.length,
        notes: notes.length,
        auditLogs: auditLogs.length,
        loginRecords: loginRecords.length,
        tags: tags.length,
        companyTags: companyTags.length,
        contactTags: contactTags.length,
        opportunityTags: opportunityTags.length,
        opportunityContacts: opportunityContacts.length,
      },
      data: {
        users,
        companies,
        contacts,
        opportunities,
        tasks,
        activities,
        notes,
        auditLogs,
        loginRecords,
        tags,
        companyTags,
        contactTags,
        opportunityTags,
        opportunityContacts,
      },
    }

    const filename = `solocrm-backup-${new Date().toISOString().slice(0, 10)}.json`
    const json = JSON.stringify(backup, null, 2)

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[BACKUP_ERROR]', error)
    return NextResponse.json({ error: 'Failed to generate backup' }, { status: 500 })
  }
}
