import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PartidosHero } from '@/features/matches/PartidosHero'
import { PartidosContent } from '@/features/matches/PartidosContent'
import { PartidosContentSkeleton } from '@/features/matches/PartidosContentSkeleton'

export const metadata: Metadata = {
  title: 'Partidos | AD Ceuta FC Info',
  description: 'Calendario y resultados del AD Ceuta FC en la Liga Hypermotion. Próximos partidos, jornadas y marcadores.',
}

export const revalidate = 300

export default function PartidosServerPage() {
  return (
    <div className="page">
      {/* Renders immediately — no await */}
      <PartidosHero />

      {/* Dynamic sections stream in; skeleton shown while awaiting data */}
      <Suspense fallback={<PartidosContentSkeleton />}>
        <PartidosContent />
      </Suspense>
    </div>
  )
}
