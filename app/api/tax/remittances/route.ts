import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireActiveSession } from '@/lib/session'
import { centsFromDecimal, toDateOnly } from '@/lib/tax'

export async function GET() {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const rows = await prisma.taxCashEntry.findMany({
    where: { userId: session.userId, type: 'CLIENT_REMITTANCE' },
    orderBy: [{ documentDate: 'desc' }, { createdAt: 'desc' }],
    include: {
      workSessions: {
        orderBy: [{ workDate: 'asc' }, { createdAt: 'asc' }],
      },
    },
  })

  return NextResponse.json(
    {
      records: rows.map((entry) => ({
        id: entry.id,
        reference: entry.reference,
        description: entry.description,
        documentDate: entry.documentDate ? toDateOnly(entry.documentDate) : null,
        expectedPaymentDate: entry.expectedPaymentDate ? toDateOnly(entry.expectedPaymentDate) : null,
        paymentDate: entry.paymentDate ? toDateOnly(entry.paymentDate) : null,
        netCents: centsFromDecimal(entry.netAmount),
        vatCents: centsFromDecimal(entry.vatAmount),
        grossCents: centsFromDecimal(entry.grossAmount),
        aiExtracted: entry.aiExtracted,
        sourceFileName: entry.sourceFileName,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        workSessions: entry.workSessions.map((sessionRow) => ({
          id: sessionRow.id,
          workDate: toDateOnly(sessionRow.workDate),
          hours: sessionRow.hours.toString(),
          activity: sessionRow.activity,
          projectLabel: sessionRow.projectLabel,
          sourcePage: sessionRow.sourcePage,
        })),
      })),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
