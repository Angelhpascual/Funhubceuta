'use client'

type MvpVote = { candidate_id: string; candidate_name: string; fingerprint: string; created_at: string }
type HistoryEntry = { id: string; match_label: string; winner_name: string | null; winner_votes: number | null; closed_at: string | null; votes: MvpVote[] }

interface Props {
  history: HistoryEntry[]
  expandedId: string | null
  onToggle: (id: string) => void
}

export function MvpHistory({ history, expandedId, onToggle }: Props) {
  if (history.length === 0) return null

  return (
    <div>
      <div className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-ceuta-muted mb-2">Historial</div>
      <div className="space-y-1.5">
        {history.map(h => (
          <div key={h.id} className="rounded-xl border border-ceuta-border overflow-hidden">
            <button type="button"
              className="w-full flex items-center justify-between px-3 py-2.5 text-left bg-ceuta-bg-soft hover:bg-ceuta-bg-mid transition-colors"
              onClick={() => onToggle(h.id)}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-5 h-5 rounded-full bg-ceuta-gold flex items-center justify-center font-display text-[9px] font-black text-ceuta-black shrink-0">★</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[12px] font-bold text-ceuta-black truncate">{h.match_label}</div>
                  {h.winner_name && <div className="font-display text-[10px] text-ceuta-muted">{h.winner_name}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {h.winner_votes != null && <span className="font-display text-[11px] font-bold text-ceuta-black">{h.winner_votes} votos</span>}
                <span className="text-ceuta-muted text-[10px]">{expandedId === h.id ? '▲' : '▼'}</span>
              </div>
            </button>

            {expandedId === h.id && (
              <div className="border-t border-ceuta-border divide-y divide-ceuta-border bg-white">
                {h.votes.length === 0 && (
                  <div className="px-4 py-3 font-display text-[11px] text-ceuta-muted">Sin votos registrados</div>
                )}
                {h.votes.map((v, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[10px] text-ceuta-muted w-4">{i + 1}</span>
                      <span className="font-display text-[12px] font-bold text-ceuta-black">{v.candidate_name}</span>
                    </div>
                    <span className="font-display text-[10px] text-ceuta-muted font-mono">{v.fingerprint.slice(0, 8)}…</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
