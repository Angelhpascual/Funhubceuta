import type { Metadata } from 'next'
import MerchanPage from '@/features/merchan/MerchanPage'

export const metadata: Metadata = {
  title: 'Tienda | AD Ceuta FC Info',
  description: 'Camisetas, equipaciones y merchandising oficial del AD Ceuta FC. Viste los colores caballas.',
}

export default function Page() {
  return <MerchanPage />
}
