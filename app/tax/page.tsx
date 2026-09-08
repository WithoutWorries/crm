import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { TaxHorizon } from '@/components/tax/tax-horizon'

export const dynamic = 'force-dynamic'

export default async function TaxPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  return <TaxHorizon />
}
