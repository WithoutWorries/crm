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
  } catch (error) {
    // Existing mutations are not yet transactional with their audit record. Make
    // failures visible until Stage 3 introduces controlled engineering revisions.
    console.error('[AUDIT_LOG_ERROR]', { userId, action, entity, entityId, error })
  }
}
