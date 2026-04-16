import { prisma } from '@/lib/prisma'

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE'

export async function logAudit(
  userId: string,
  action: AuditAction,
  entity: string,
  entityId: string,
  entityName?: string
) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, entityName: entityName ?? null },
    })
  } catch {
    // Audit logging failure should never break the main operation
  }
}
