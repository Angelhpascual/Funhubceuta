import { ClubHero } from '@/features/club/ClubHero'
import { ClubContentSkeleton } from '@/features/club/ClubContentSkeleton'

export default function Loading() {
  return (
    <div className="page">
      <ClubHero />
      <ClubContentSkeleton />
    </div>
  )
}
