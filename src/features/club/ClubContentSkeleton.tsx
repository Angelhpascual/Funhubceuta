// Skeleton for the dynamic content section (chips + cards), shown while ClubContent streams in.
// Does NOT include the hero — that is already visible via ClubHero.

export function ClubContentSkeleton() {
  return (
    <div className="animate-pulse pb-8">
      {/* Chips — estáticos con texto real para evitar salto visual */}
      <div className="chips mt-4 mb-3">
        <button type="button" className="chip active" disabled>Estadísticas</button>
        <button type="button" className="chip" disabled>Plantilla</button>
        <button type="button" className="chip" disabled>Historia</button>
        <button type="button" className="chip" disabled>Estadio</button>
        <button type="button" className="chip" disabled>Mascota</button>
      </div>

      {/* Hero stat card (negro) */}
      <div className="mx-4 rounded-[16px] bg-[var(--black)] p-5 shadow-[6px_6px_0_var(--red)]">
        <div className="flex items-end gap-3">
          <div className="h-[80px] w-[60px] rounded-[6px] bg-white/10" />
          <div className="pb-2 space-y-2">
            <div className="h-[11px] w-20 rounded-[3px] bg-white/20" />
            <div className="h-[11px] w-28 rounded-[3px] bg-white/10" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-[10px] bg-white/[0.07] p-3 space-y-1.5">
              <div className="h-6 w-8 rounded-[3px] bg-white/15" />
              <div className="h-[9px] w-12 rounded-[3px] bg-white/10" />
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-white/10 pt-4 flex items-baseline gap-2">
          <div className="h-9 w-12 rounded-[4px] bg-white/15" />
          <div className="h-[11px] w-14 rounded-[3px] bg-white/10" />
        </div>
      </div>

      {/* WDL + Goals grid */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-[14px] border border-[var(--border)] bg-[var(--white)] p-4 space-y-3">
            <div className="h-[10px] w-20 rounded-[3px] bg-[var(--bg-mid)]" />
            <div className="mx-auto size-[90px] rounded-full bg-[var(--bg-mid)]" />
            <div className="space-y-2">
              {[0, 1, 2].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="size-[9px] rounded-[2px] bg-[var(--bg-mid)]" />
                  <div className="flex-1 h-[10px] rounded-[3px] bg-[var(--bg-mid)]" />
                  <div className="h-[13px] w-4 rounded-[3px] bg-[var(--bg-mid)]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Protagonistas */}
      <div className="mx-4 mt-3 space-y-3">
        <div className="h-[11px] w-40 rounded-[3px] bg-[var(--bg-mid)]" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-[14px] border border-[var(--border)] bg-[var(--white)] p-4">
            <div className="ml-2 size-[56px] shrink-0 rounded-full bg-[var(--bg-mid)]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-[10px] w-20 rounded-[3px] bg-[var(--bg-mid)]" />
              <div className="h-[18px] w-32 rounded-[3px] bg-[var(--bg-mid)]" />
              <div className="h-[10px] w-16 rounded-[3px] bg-[var(--bg-mid)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
