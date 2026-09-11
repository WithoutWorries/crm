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

  const current = await prisma.taxPayment.findFirst({
    where: { id, userId: session.userId, voidedAt: null },
    include: { taxLiability: true },
  })
  if (!current) return NextResponse.json({ error: 'Active tax payment not found' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.taxPayment.update({ where: { id }, data: { voidedAt: new Date() } })
    if (current.settlesPeriod && current.taxLiability?.status === 'PAID') {
      await tx.taxLiability.update({
        where: { id: current.taxLiability.id },
        data: {
          status: current.taxLiability.source === 'TAX_NOTICE' ? 'NOTICE_RECEIVED' : 'ESTIMATED',
          paidAt: null,
        },
      })
    } else if (current.taxLiability && current.taxLiability.status !== 'PAID' && !current.settlesPeriod && !(current.type === 'VAT' && current.taxLiability.source === 'CALCULATED')) {
      await tx.taxLiability.update({
        where: { id: current.taxLiability.id },
        data: { amount: { increment: current.paidAmount } },
      })
    }
  })

  if (current.type === 'VAT') await rebuildCalculatedVat(session.userId)
  await logAudit(session.userId, 'UPDATE', 'TaxPayment', id)
  return NextResponse.json({ success: true })
}
