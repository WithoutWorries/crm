import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { requireActiveSession } from '@/lib/session'

export async function GET() {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    })
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const users = await prisma.user.findMany({
      where: { workspaceId: session.workspaceId },
      select: {
        id: true, workspaceId: true, name: true, email: true, role: true,
        isActive: true, createdAt: true, lastNotificationReadAt: true,
        // Passwords, calendar tokens and active sessions are intentionally excluded.
      },
      orderBy: { createdAt: 'asc' },
    })
    const userIds = users.map((user) => user.id)

    const [
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
      procurementProjects,
      procurementSuppliers,
      procurementQuotes,
      securityEvents,
    ] = await Promise.all([
      prisma.company.findMany({ where: { userId: { in: userIds } }, orderBy: { createdAt: 'asc' } }),
      prisma.contact.findMany({ where: { userId: { in: userIds } }, orderBy: { createdAt: 'asc' } }),
      prisma.opportunity.findMany({ where: { userId: { in: userIds } }, orderBy: { createdAt: 'asc' } }),
      prisma.task.findMany({ where: { userId: { in: userIds } }, orderBy: { createdAt: 'asc' } }),
      prisma.activity.findMany({ where: { userId: { in: userIds } }, orderBy: { happenedAt: 'asc' } }),
      prisma.note.findMany({
        where: {
          OR: [
            { userId: session.userId, isKnowledge: true },
            { userId: { in: userIds }, isKnowledge: false },
          ],
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.auditLog.findMany({ where: { userId: { in: userIds } }, orderBy: { createdAt: 'asc' } }),
      prisma.loginRecord.findMany({ where: { userId: { in: userIds } }, orderBy: { loginAt: 'asc' } }),
      prisma.tag.findMany({ where: { userId: { in: userIds } }, orderBy: { createdAt: 'asc' } }),
      prisma.companyTag.findMany({ where: { company: { userId: { in: userIds } } } }),
      prisma.contactTag.findMany({ where: { contact: { userId: { in: userIds } } } }),
      prisma.opportunityTag.findMany({ where: { opportunity: { userId: { in: userIds } } } }),
      prisma.opportunityContact.findMany({ where: { opportunity: { userId: { in: userIds } } } }),
      prisma.procurementProject.findMany({
        where: { userId: { in: userIds } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.procurementSupplier.findMany({
        where: { userId: { in: userIds } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.procurementQuote.findMany({
        where: { project: { userId: { in: userIds } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.securityEvent.findMany({
        where: { userId: { in: userIds } },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const backup = {
      exportedAt: new Date().toISOString(),
      schemaVersion: '7.0',
      scope: {
        workspace,
        exportedByUserId: session.userId,
        privateKnowledgePolicy: 'Only the exporting administrator’s private knowledge is included.',
      },
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
        procurementProjects: procurementProjects.length,
        procurementSuppliers: procurementSuppliers.length,
        procurementQuotes: procurementQuotes.length,
        securityEvents: securityEvents.length,
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
        procurementProjects,
        procurementSuppliers,
        procurementQuotes,
        securityEvents,
      },
    }

    const filename = `reference-backup-${new Date().toISOString().slice(0, 10)}.json`
    const json = JSON.stringify(backup, null, 2)
    const digest = createHash('sha256').update(json).digest('hex')

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Backup-SHA256': digest,
      },
    })
  } catch (error) {
    console.error('[BACKUP_ERROR]', error)
    return NextResponse.json({ error: 'Failed to generate backup' }, { status: 500 })
  }
}
