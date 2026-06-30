import { getTransfers } from '@/infrastructure/supabase/TransfersRepository'
import MercadoClient from './MercadoClient'

export const revalidate = 300

export default async function MercadoPage() {
  const transfers = await getTransfers()
  return <MercadoClient transfers={transfers} />
}
