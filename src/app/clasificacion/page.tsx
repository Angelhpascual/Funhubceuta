import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ClasificacionHero } from '@/features/standings/ClasificacionHero'
import { ClasificacionContent } from '@/features/standings/ClasificacionContent'
import { ClasificacionContentSkeleton } from '@/features/standings/ClasificacionContentSkeleton'

export const metadata: Metadata = {
  title: 'Clasificación | AD Ceuta FC Info',
  description: 'Tabla de clasificación de la Liga Hypermotion. Posición, puntos, goles y racha del AD Ceuta FC.',
}

export const revalidate = 300

export default function ClasificacionServerPage() {
  return (
    <div className="page">
      <ClasificacionHero />
      <Suspense fallback={<ClasificacionContentSkeleton />}>
        <ClasificacionContent />
      </Suspense>
    </div>
  )
}
