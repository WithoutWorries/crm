import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { requireActiveSession } from '@/lib/session'
import { rebuildCalculatedVat } from '@/lib/tax'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const entry = await prisma.taxCashEntry.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  })
  if (!entry) return NextResponse.json({ error: 'Cash entry not found' }, { status: 404 })

  await prisma.taxCashEntry.delete({ where: { id } })
  await rebuildCalculatedVat(session.userId)
  await logAudit(session.userId, 'DELETE', 'TaxCashEntry', id)
  return NextResponse.json({ success: true })
}
