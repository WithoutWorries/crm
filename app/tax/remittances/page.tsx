import { redirect } from 'next/navigation'
import { RemittanceRecords } from '@/components/tax/remittance-records'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function RemittanceRecordsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  return <RemittanceRecords />
}
