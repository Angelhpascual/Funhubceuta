// Skeleton for the dynamic content section (chips + table), shown while ClasificacionContent streams in.
// Does NOT include the hero — that is already visible via ClasificacionHero.

function SkeletonRow({ i }: { i: number }) {
  return (
    <div
      className="grid items-center gap-1 border-b border-ceuta-border px-[14px] py-[11px] grid-cols-[32px_1fr_repeat(4,28px)_34px]"
      style={{ opacity: 1 - i * 0.03 }}
    >
      <div className="mx-auto h-[14px] w-4 animate-pulse rounded-[3px] bg-ceuta-bg-mid" />
      <div className="flex items-center gap-2">
        <div className="size-[22px] shrink-0 animate-pulse rounded-full bg-ceuta-bg-mid" />
        <div
          className="h-[13px] animate-pulse rounded-[3px] bg-ceuta-bg-mid"
          style={{ width: 90 + (i % 3) * 20 }}
        />
      </div>
      {[1, 2, 3, 4, 5].map((j) => (
        <div key={j} className="mx-auto h-[13px] w-5 animate-pulse rounded-[3px] bg-ceuta-bg-mid" />
      ))}
    </div>
  )
}

export function ClasificacionContentSkeleton() {
  return (
    <>
      {/* Chips — estáticos con texto real para evitar salto visual */}
      <div className="chips mt-4 mb-2">
        <button type="button" className="chip active" disabled>Actual</button>
        <button type="button" className="chip" disabled>Temp. 25/26</button>
      </div>

      {/* Table header */}
      <div className="grid items-center gap-1 border-b-2 border-[var(--black)] px-[14px] pb-2 grid-cols-[32px_1fr_repeat(4,28px)_34px]">
        {['#', 'Equipo', 'PJ', 'DG', 'GF', 'GC', 'PTS'].map((h, i) => (
          <div key={h} className={`font-display text-[10px] font-bold uppercase tracking-[0.1em] ${i === 0 || i > 1 ? 'text-center' : 'text-left'} text-[var(--muted)]`}>
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: 20 }).map((_, i) => (
        <SkeletonRow key={i} i={i} />
      ))}
    </>
  )
}
