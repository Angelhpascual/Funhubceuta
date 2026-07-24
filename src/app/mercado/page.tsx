import { getTransfers } from '@/lib/serverFetches'
import MercadoClient from './MercadoClient'

export const revalidate = 300

export default async function MercadoPage() {
  const transfers = await getTransfers()
  return <MercadoClient transfers={transfers} />
}
