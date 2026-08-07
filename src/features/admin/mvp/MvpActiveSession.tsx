'use client'

type Candidate = { id: string; name: string; number: number; position: string; photo_url?: string }
type Session = {
  id: string
  match_label: string
  status: 'pending' | 'open' | 'closed'
  winner_name: string | null
  winner_votes: number | null
  candidates: Candidate[]
}
type VoteTally = { candidate_id: string; count: number }

interface Props {
  session: Session
  tallies: VoteTally[]
  totalVotes: number
  busy: boolean
  onAction: (path: string, method: string, body: unknown) => void
}

export function MvpActiveSession({ session, tallies, totalVotes, busy, onAction }: Props) {
  return (
    <div className={`rounded-[14px] p-4 space-y-3 ${
      session.status !== 'pending' ? 'bg-ceuta-black text-white' : 'bg-ceuta-bg-soft border border-ceuta-border'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className={`font-display text-[10px] font-bold tracking-[0.14em] uppercase mb-0.5 ${session.status !== 'pending' ? 'text-white/50' : 'text-ceuta-muted'}`}>
            Sesión activa
          </div>
          <div className={`font-display font-black text-[18px] uppercase leading-tight truncate ${session.status !== 'pending' ? 'text-white' : 'text-ceuta-black'}`}>
            {session.match_label}
          </div>
        </div>
        <span className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full font-display text-[10px] font-bold tracking-[0.1em] uppercase ${
          session.status === 'open' ? 'bg-[#1E9E4B] text-white' :
          session.status === 'closed' ? 'bg-white/10 text-white/70' :
          'bg-ceuta-bg-mid text-ceuta-muted'
        }`}>
          {session.status === 'open' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
          {session.status === 'pending' ? 'Pendiente' : session.status === 'open' ? 'Abierta' : 'Cerrada'}
        </span>
      </div>

      {/* Ganador (closed) */}
      {session.status === 'closed' && session.winner_name && (
        <div className="flex items-center gap-3 bg-white/8 rounded-[10px] px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-ceuta-gold flex items-center justify-center font-display text-[12px] font-black text-ceuta-black shrink-0">★</div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-[10px] font-bold tracking-[0.12em] uppercase text-ceuta-gold">MVP</div>
            <div className="font-display font-black text-[16px] text-white truncate">{session.winner_name}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display font-black text-[20px] text-white">{session.winner_votes}</div>
            <div className="font-display text-[9px] text-white/50 uppercase tracking-wide">votos</div>
          </div>
        </div>
      )}

      {/* Candidatos con barras de voto (open) */}
      {session.status === 'open' && session.candidates.length > 0 && (
        <div className="space-y-1.5">
          {session.candidates.map((c) => {
            const votes = tallies.find(t => t.candidate_id === c.id)?.count ?? 0
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
            return (
              <div key={c.id} className="flex items-center gap-2">
                <span className="font-display text-[10px] font-bold text-white/50 w-5 shrink-0">#{c.number}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-display text-[12px] font-bold text-white truncate">{c.name}</span>
                    <span className="font-display text-[10px] text-white/60 shrink-0 ml-2">{votes} ({pct}%)</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-ceuta-red rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
          <div className="font-display text-[10px] text-white/40 text-right pt-1">{totalVotes} votos totales</div>
        </div>
      )}

      {/* Candidatos (pending) */}
      {session.status === 'pending' && (
        <div className="flex flex-wrap gap-1.5">
          {session.candidates.map(c => (
            <span key={c.id} className="font-display text-[11px] font-bold px-2.5 py-1 rounded-full bg-ceuta-bg-mid text-ceuta-black border border-ceuta-border">
              #{c.number} {c.name}
            </span>
          ))}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 pt-1">
        {session.status === 'pending' && (
          <button type="button"
            disabled={busy}
            onClick={() => onAction('/api/admin/mvp/session', 'PATCH', { sessionId: session.id, action: 'open' })}
            className="flex-1 py-2.5 rounded-xl font-display text-[12px] font-bold tracking-[0.08em] uppercase bg-[#1E9E4B] text-white disabled:opacity-40 transition-opacity"
          >
            {busy ? '⏳' : '▶ Abrir votación'}
          </button>
        )}
        {session.status === 'open' && (
          <button type="button"
            disabled={busy}
            onClick={() => onAction('/api/admin/mvp/session', 'PATCH', { sessionId: session.id, action: 'close' })}
            className="flex-1 py-2.5 rounded-xl font-display text-[12px] font-bold tracking-[0.08em] uppercase bg-ceuta-red text-white disabled:opacity-40 transition-opacity"
          >
            {busy ? '⏳' : '■ Cerrar y proclamar MVP'}
          </button>
        )}
        <button type="button"
          disabled={busy}
          onClick={() => {
            if (!confirm('¿Quitar el banner del MVP? Se borrará la sesión y sus votos.')) return
            onAction('/api/admin/mvp/session', 'DELETE', { sessionId: session.id })
          }}
          className={`px-4 py-2.5 rounded-xl font-display text-[12px] font-bold tracking-[0.08em] uppercase disabled:opacity-40 transition-opacity ${
            session.status !== 'pending' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-ceuta-bg-mid text-ceuta-black border border-ceuta-border hover:border-ceuta-black'
          }`}
        >
          Quitar
        </button>
      </div>
    </div>
  )
}
