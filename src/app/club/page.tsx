import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ClubHero } from '@/features/club/ClubHero'
import { ClubContent } from '@/features/club/ClubContent'
import { ClubContentSkeleton } from '@/features/club/ClubContentSkeleton'

export const metadata: Metadata = {
  title: 'Club | AD Ceuta FC Info',
  description: 'Estadísticas, plantilla, historia y toda la información del AD Ceuta FC.',
}

export const revalidate = 300

export default function ClubServerPage() {
  return (
    <div className="page">
      {/* Renders immediately — no await */}
      <ClubHero />

      {/* Dynamic sections stream in; skeleton shown while awaiting data */}
      <Suspense fallback={<ClubContentSkeleton />}>
        <ClubContent />
      </Suspense>
    </div>
  )
}
