'use client'

type SeasonEntry = { name: string; wins: number; votes: number; photo_url: string | null }

export function MvpSeasonRanking({ ranking }: { ranking: SeasonEntry[] }) {
  if (ranking.length === 0) return null

  return (
    <div>
      <div className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-ceuta-muted mb-2">🏅 Ranking temporada</div>
      <div className="space-y-1.5">
        {ranking.map((p, i) => (
          <div key={p.name} className="flex items-center gap-3 px-3 py-2.5 bg-ceuta-bg-soft rounded-xl border border-ceuta-border">
            <div className="font-display text-[11px] font-black text-ceuta-muted w-4 text-center shrink-0">{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[12px] font-bold text-ceuta-black truncate">{p.name}</div>
              <div className="font-display text-[10px] text-ceuta-muted">{p.votes} votos totales</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="font-display text-[13px] font-black text-ceuta-gold">{p.wins}</span>
              <span className="font-display text-[9px] font-bold text-ceuta-muted uppercase">MVP{p.wins !== 1 ? 's' : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
