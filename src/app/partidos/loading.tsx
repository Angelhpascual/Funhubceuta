import { PartidosHero } from '@/features/matches/PartidosHero'
import { PartidosContentSkeleton } from '@/features/matches/PartidosContentSkeleton'

export default function Loading() {
  return (
    <div className="page">
      <PartidosHero />
      <PartidosContentSkeleton />
    </div>
  )
}
