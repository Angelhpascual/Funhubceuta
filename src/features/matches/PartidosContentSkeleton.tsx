// Skeleton for the dynamic content section (chips + cards), shown while PartidosContent streams in.
// Does NOT include the hero — that is already visible via PartidosHero.

function SkeletonMatchCard() {
  return (
    <div className="bg-[var(--black)] rounded-[var(--radius)] overflow-hidden mb-3">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="h-[22px] w-20 animate-pulse rounded-[5px] bg-white/10" />
        <div className="h-3 w-24 animate-pulse rounded-[3px] bg-white/10" />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 pb-4">
        <div className="flex flex-col items-center gap-2">
          <div className="size-[52px] animate-pulse rounded-full bg-white/10" />
          <div className="h-[13px] w-16 animate-pulse rounded-[3px] bg-white/10" />
        </div>
        <div className="h-10 w-[60px] animate-pulse rounded-[8px] bg-white/10" />
        <div className="flex flex-col items-center gap-2">
          <div className="size-[52px] animate-pulse rounded-full bg-white/10" />
          <div className="h-[13px] w-16 animate-pulse rounded-[3px] bg-white/10" />
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-3">
        <div className="h-[11px] w-32 animate-pulse rounded-[3px] bg-white/10" />
      </div>
    </div>
  )
}

function SkeletonUpcomingRow() {
  return (
    <div className="mb-2 bg-[var(--white)] border border-[var(--border)] rounded-[var(--radius)] px-[14px] py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div className="flex flex-col items-center gap-1.5">
        <div className="size-8 animate-pulse rounded-full bg-[var(--bg-mid)]" />
        <div className="h-[11px] w-12 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="h-[11px] w-16 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
        <div className="h-4 w-10 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <div className="size-8 animate-pulse rounded-full bg-[var(--bg-mid)]" />
        <div className="h-[11px] w-12 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
      </div>
    </div>
  )
}

export function PartidosContentSkeleton() {
  return (
    <>
      {/* Chips — estáticos con texto real para evitar salto visual */}
      <div className="chips mt-4 mb-2">
        <button type="button" className="chip active" disabled>Próximos</button>
        <button type="button" className="chip" disabled>Resultados</button>
        <button type="button" className="chip" disabled>Temp. 25/26</button>
      </div>

      <div className="px-4 pt-2 pb-8">
        {/* Featured next match card */}
        <SkeletonMatchCard />

        {/* Section label */}
        <div className="mt-5 mb-3 h-[11px] w-24 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />

        {/* Upcoming rows */}
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonUpcomingRow key={i} />
        ))}

        {/* Results section */}
        <div className="mt-5 mb-3 h-[11px] w-20 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonUpcomingRow key={i} />
        ))}
      </div>
    </>
  )
}
