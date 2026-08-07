import { MerchanHero } from '@/features/merchan/MerchanHero'
import { MerchanContentSkeleton } from '@/features/merchan/MerchanContentSkeleton'

export default function Loading() {
  return (
    <div className="page">
      <MerchanHero />
      <MerchanContentSkeleton />
    </div>
  )
}
