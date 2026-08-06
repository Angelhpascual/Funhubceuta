'use client'

type SessionAnalytic = { id: string; match_label: string; status: string; winner_name: string | null; winner_votes: number | null; clicks: number; opens: number; voteCasts: number; suspicious: boolean; uniqueVoters: number }

export function MvpAnalytics({ analytics }: { analytics: SessionAnalytic[] }) {
  const visible = analytics.filter(a => a.clicks > 0 || a.opens > 0 || a.voteCasts > 0)
  if (visible.length === 0) return null

  return (
    <div>
      <div className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-ceuta-muted mb-2">📊 Participación por sesión</div>
      <div className="space-y-2">
        {visible.map(a => (
          <div key={a.id} className={`px-3 py-2.5 rounded-xl border ${a.suspicious ? 'border-red-300 bg-red-50' : 'border-ceuta-border bg-ceuta-bg-soft'}`}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="font-display text-[11px] font-bold text-ceuta-black truncate">{a.match_label}</div>
              {a.suspicious && (
                <span className="shrink-0 font-display text-[9px] font-bold uppercase text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">⚠ Sospechoso</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="font-display text-[14px] font-black text-ceuta-black">{a.clicks}</div>
                <div className="font-display text-[9px] uppercase text-ceuta-muted">Clicks</div>
              </div>
              <div>
                <div className="font-display text-[14px] font-black text-ceuta-black">{a.opens}</div>
                <div className="font-display text-[9px] uppercase text-ceuta-muted">Abiertos</div>
              </div>
              <div>
                <div className="font-display text-[14px] font-black text-ceuta-black">{a.voteCasts}</div>
                <div className="font-display text-[9px] uppercase text-ceuta-muted">Votos</div>
              </div>
            </div>
            {a.voteCasts > 0 && (
              <div className="mt-1.5 text-[10px] text-ceuta-muted">
                {a.uniqueVoters} votantes únicos · tasa de voto {Math.round((a.voteCasts / Math.max(a.opens, 1)) * 100)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
