function SkeletonRow({ i }: { i: number }) {
  return (
    <div
      className="grid items-center gap-1 border-b border-[var(--border)] px-[14px] py-[11px] grid-cols-[32px_1fr_repeat(4,28px)_34px]"
      style={{ opacity: 1 - i * 0.04 }}
    >
      <div className="mx-auto h-[13px] w-4 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
      <div className="flex items-center gap-2">
        <div className="size-[22px] shrink-0 animate-pulse rounded-full bg-[var(--bg-mid)]" />
        <div className="h-[13px] animate-pulse rounded-[3px] bg-[var(--bg-mid)]" style={{ width: 72 + (i % 3) * 22 }} />
      </div>
      {[0, 1, 2, 3, 4].map((j) => (
        <div key={j} className="mx-auto h-[13px] w-5 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
      ))}
    </div>
  )
}

export default function Loading() {
  return (
    <div>
      {/* Header chip skeleton */}
      <div className="px-4 pt-5 pb-3">
        <div className="h-[34px] w-48 animate-pulse rounded-full bg-[var(--bg-mid)]" />
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[32px_1fr_repeat(4,28px)_34px] gap-1 border-b border-[var(--border)] px-[14px] py-2">
        <div className="mx-auto h-[10px] w-3 animate-pulse rounded-[2px] bg-[var(--bg-mid)]" />
        <div className="h-[10px] w-10 animate-pulse rounded-[2px] bg-[var(--bg-mid)]" />
        {[0, 1, 2, 3, 4].map((j) => (
          <div key={j} className="mx-auto h-[10px] w-4 animate-pulse rounded-[2px] bg-[var(--bg-mid)]" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: 20 }).map((_, i) => (
        <SkeletonRow key={i} i={i} />
      ))}
    </div>
  )
}
