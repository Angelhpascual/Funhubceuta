import { ClasificacionHero } from '@/features/standings/ClasificacionHero'
import { ClasificacionContentSkeleton } from '@/features/standings/ClasificacionContentSkeleton'

export default function Loading() {
  return (
    <div className="page">
      <ClasificacionHero />
      <ClasificacionContentSkeleton />
    </div>
  )
}
