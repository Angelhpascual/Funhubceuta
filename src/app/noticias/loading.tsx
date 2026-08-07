function SkeletonNewsCard({ tall }: { tall?: boolean }) {
  return (
    <div className="bg-[var(--white)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden mb-3">
      <div className={`animate-pulse bg-[var(--bg-mid)] w-full ${tall ? 'h-[180px]' : 'h-[120px]'}`} />
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-[10px] w-14 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
          <div className="h-[10px] w-10 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
        </div>
        <div className="h-[14px] w-full animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
        <div className="h-[14px] w-4/5 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
      </div>
    </div>
  )
}

function SkeletonNewsRow() {
  return (
    <div className="flex gap-3 border-b border-[var(--border)] py-3">
      <div className="size-[72px] shrink-0 animate-pulse rounded-[10px] bg-[var(--bg-mid)]" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-[13px] w-full animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
        <div className="h-[13px] w-3/4 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
        <div className="h-[10px] w-16 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="px-4 pt-4 pb-8">
      {/* Featured */}
      <SkeletonNewsCard tall />

      {/* Source chips */}
      <div className="flex gap-2 mb-4 overflow-hidden">
        {[40, 56, 36, 64, 44].map((w, i) => (
          <div key={i} className="h-[30px] shrink-0 animate-pulse rounded-full bg-[var(--bg-mid)]" style={{ width: w }} />
        ))}
      </div>

      {/* News rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonNewsRow key={i} />
      ))}
    </div>
  )
}
