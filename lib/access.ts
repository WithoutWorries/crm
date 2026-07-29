import { prisma } from '@/lib/prisma'

export async function workspaceReferencesExist(
  workspaceId: string,
  references: {
    companyId?: string | null
    contactId?: string | null
    opportunityId?: string | null
  }
): Promise<boolean> {
  const [company, contact, opportunity] = await Promise.all([
    references.companyId
      ? prisma.company.findFirst({
          where: { id: references.companyId, user: { workspaceId } },
          select: { id: true },
        })
      : null,
    references.contactId
      ? prisma.contact.findFirst({
          where: { id: references.contactId, user: { workspaceId } },
          select: { id: true },
        })
      : null,
    references.opportunityId
      ? prisma.opportunity.findFirst({
          where: { id: references.opportunityId, user: { workspaceId } },
          select: { id: true },
        })
      : null,
  ])

  return !(
    (references.companyId && !company) ||
    (references.contactId && !contact) ||
    (references.opportunityId && !opportunity)
  )
}
