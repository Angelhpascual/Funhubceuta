import { Suspense } from 'react'
import type { Metadata } from 'next'
import { MerchanHero } from '@/features/merchan/MerchanHero'
import MerchanPage from '@/features/merchan/MerchanPage'
import { MerchanContentSkeleton } from '@/features/merchan/MerchanContentSkeleton'

export const metadata: Metadata = {
  title: 'Tienda | AD Ceuta FC Info',
  description: 'Camisetas, equipaciones y merchandising oficial del AD Ceuta FC. Viste los colores caballas.',
}

export default function Page() {
  return (
    <div className="page">
      {/* Renders immediately — no await */}
      <MerchanHero />

      {/* Client component with internal loading state; Suspense acts as boundary */}
      <Suspense fallback={<MerchanContentSkeleton />}>
        <MerchanPage />
      </Suspense>
    </div>
  )
}
