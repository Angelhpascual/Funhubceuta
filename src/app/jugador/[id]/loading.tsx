export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Hero — fondo negro como la página real */}
      <div className="bg-[var(--black)] px-4 pt-12 pb-6">
        <div className="flex items-end gap-4">
          {/* Foto jugador */}
          <div className="size-[88px] shrink-0 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2 pb-1">
            {/* Dorsal */}
            <div className="h-[11px] w-8 rounded-[3px] bg-white/20" />
            {/* Nombre */}
            <div className="h-6 w-36 rounded-[4px] bg-white/20" />
            {/* Posición */}
            <div className="h-[11px] w-20 rounded-[3px] bg-white/15" />
          </div>
        </div>

        {/* Stat tiles dentro del hero */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-[10px] bg-white/[0.07] p-3 space-y-1">
              <div className="h-6 w-8 rounded-[3px] bg-white/15" />
              <div className="h-[10px] w-12 rounded-[3px] bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-4 pt-5 pb-8 space-y-3">
        <div className="h-[11px] w-28 rounded-[3px] bg-[var(--bg-mid)]" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-[12px] border border-[var(--border)] bg-[var(--white)] p-4 space-y-1.5">
              <div className="h-7 w-10 rounded-[4px] bg-[var(--bg-mid)]" />
              <div className="h-[10px] w-16 rounded-[3px] bg-[var(--bg-mid)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
