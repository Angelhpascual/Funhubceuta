// Skeleton for the dynamic content section (grid de productos), shown while MerchanPage loads.
// Does NOT include the hero — that is already visible via MerchanHero.

function SkeletonProductCard() {
  return (
    <div className="bg-[var(--white)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
      <div className="aspect-square w-full animate-pulse bg-[var(--bg-mid)]" />
      <div className="p-3 space-y-2">
        <div className="h-[13px] w-3/4 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
        <div className="h-5 w-14 animate-pulse rounded-[4px] bg-[var(--bg-mid)]" />
      </div>
    </div>
  )
}

export function MerchanContentSkeleton() {
  return (
    <div className="px-4 pt-4 pb-8 grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => <SkeletonProductCard key={i} />)}
    </div>
  )
}
