'use client'

import { useState, useEffect } from 'react'

type Candidate = { id: string; name: string; number: number; position: string; photo_url?: string }
type Session = {
  id: string
  match_label: string
  status: 'pending' | 'open' | 'closed'
  winner_name: string | null
  winner_votes: number | null
  candidates: Candidate[]
  opened_at: string | null
  closed_at: string | null
}
type SquadPlayer = {
  id: string
  name: string
  dorsal: number
  position: string
  position_group: string
  photo_url?: string
}

export function MvpAdmin() {
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [matchLabel, setMatchLabel] = useState('')
  const [squad, setSquad] = useState<SquadPlayer[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  async function load() {
    try {
      const res = await fetch('/api/mvp/active')
      const data = await res.json()
      setActiveSession(data.session)
    } finally {
      setLoading(false)
    }
  }

  async function loadSquad() {
    try {
      const res = await fetch('/api/squad')
      const data = await res.json()
      const players: SquadPlayer[] = (data.grouped ?? []).flatMap(
        (g: { players: SquadPlayer[] }) => g.players
      )
      setSquad(players)
    } catch { /* ignore */ }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (creating) loadSquad() }, [creating])

  async function apiCall(path: string, method: string, body: unknown) {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg(`Error: ${data.error ?? 'desconocido'}`)
      } else {
        setMsg('✅ Hecho')
        await load()
        setCreating(false)
        setSelectedIds(new Set())
        setMatchLabel('')
      }
    } catch {
      setMsg('Error de red')
    } finally {
      setBusy(false)
    }
  }

  function togglePlayer(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function buildCandidates(): Candidate[] {
    return squad
      .filter((p) => selectedIds.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        number: p.dorsal,
        position: p.position_group.slice(0, 3).toUpperCase(),
        photo_url: p.photo_url,
      }))
  }

  const posOrder = ['Porteros', 'Defensas', 'Centrocampistas', 'Delanteros']
  const grouped = posOrder
    .map((pos) => ({ pos, players: squad.filter((p) => p.position_group === pos) }))
    .filter((g) => g.players.length > 0)

  if (loading) return <div className="text-[12px] text-ceuta-muted">Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="sec-title-small">MVP del Partido</div>

      {/* Active session */}
      {activeSession && (
        <div className="rounded-[14px] bg-ceuta-bg-soft p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-ceuta-muted">Sesión activa</div>
              <div className="text-[16px] font-black uppercase text-ceuta-black leading-tight">{activeSession.match_label}</div>
              <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                activeSession.status === 'open' ? 'bg-ceuta-red text-white' :
                activeSession.status === 'closed' ? 'bg-ceuta-black text-white' :
                'bg-ceuta-bg-mid text-ceuta-muted'
              }`}>
                {activeSession.status === 'open' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                {activeSession.status === 'pending' ? 'Pendiente' : activeSession.status === 'open' ? 'Votación abierta' : 'Cerrada'}
              </div>
            </div>
            {activeSession.status === 'closed' && activeSession.winner_name && (
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-widest text-ceuta-gold">MVP</div>
                <div className="text-[14px] font-black text-ceuta-black">{activeSession.winner_name}</div>
                <div className="text-[10px] text-ceuta-muted">{activeSession.winner_votes} votos</div>
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {activeSession.status === 'pending' && (
              <button
                className="admin-btn admin-btn-red flex-1"
                disabled={busy}
                onClick={() => apiCall('/api/admin/mvp/session', 'PATCH', { sessionId: activeSession.id, action: 'open' })}
              >
                <span className="admin-btn-emoji">🟢</span>
                <span className="admin-btn-label">Abrir votación</span>
              </button>
            )}
            {activeSession.status === 'open' && (
              <button
                className="admin-btn admin-btn-dark flex-1"
                disabled={busy}
                onClick={() => apiCall('/api/admin/mvp/session', 'PATCH', { sessionId: activeSession.id, action: 'close' })}
              >
                <span className="admin-btn-emoji">🔴</span>
                <span className="admin-btn-label">Cerrar y proclamar MVP</span>
              </button>
            )}
            <button
              className="admin-btn admin-btn-light"
              disabled={busy}
              onClick={() => {
                if (!confirm('¿Quitar el banner del MVP? Se borrará la sesión y sus votos.')) return
                apiCall('/api/admin/mvp/session', 'DELETE', { sessionId: activeSession.id })
              }}
            >
              <span className="admin-btn-emoji">🗑️</span>
              <span className="admin-btn-label">Quitar banner</span>
            </button>
          </div>

          {activeSession.status !== 'closed' && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-ceuta-muted mb-2">Candidatos</div>
              {activeSession.candidates.map((c) => (
                <div key={c.id} className="flex items-center gap-2 py-1 border-b border-ceuta-border last:border-0">
                  <span className="text-[12px] font-black text-ceuta-black w-6 shrink-0">#{c.number}</span>
                  <span className="text-[12px] font-bold text-ceuta-black flex-1">{c.name}</span>
                  <span className="text-[10px] text-ceuta-muted">{c.position}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {msg && (
        <div className={`text-[12px] font-semibold px-3 py-2 rounded-[10px] ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-ceuta-red'}`}>
          {msg}
        </div>
      )}

      {/* Create new session */}
      {(!activeSession || activeSession.status === 'closed') && (
        creating ? (
          <div className="rounded-[14px] border border-ceuta-border p-4 space-y-4">
            <div className="text-[13px] font-bold text-ceuta-black">Nueva sesión MVP</div>

            {/* Match label */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-ceuta-muted block mb-1">Partido</label>
              <input
                type="text"
                placeholder="vs Oviedo · 12 Jul"
                value={matchLabel}
                onChange={(e) => setMatchLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-[10px] border border-ceuta-border text-[13px] bg-ceuta-bg-soft"
              />
            </div>

            {/* Player picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ceuta-muted">
                  Candidatos ({selectedIds.size} seleccionados)
                </label>
                {selectedIds.size > 0 && (
                  <button onClick={() => setSelectedIds(new Set())} className="text-[10px] text-ceuta-muted">
                    Limpiar
                  </button>
                )}
              </div>

              {squad.length === 0 ? (
                <div className="text-[12px] text-ceuta-muted">Cargando plantilla...</div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {grouped.map(({ pos, players }) => (
                    <div key={pos}>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted mb-1">{pos}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {players.map((p) => {
                          const sel = selectedIds.has(p.id)
                          return (
                            <button
                              key={p.id}
                              onClick={() => togglePlayer(p.id)}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-[8px] text-[11px] font-bold border transition-colors ${
                                sel
                                  ? 'bg-ceuta-red text-white border-ceuta-red'
                                  : 'bg-ceuta-bg-soft text-ceuta-black border-ceuta-border'
                              }`}
                            >
                              <span className="opacity-60">#{p.dorsal}</span>
                              {p.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 py-2.5 rounded-[10px] bg-ceuta-red text-white text-[12px] font-bold uppercase disabled:opacity-40"
                disabled={busy || !matchLabel || selectedIds.size < 2}
                onClick={() => apiCall('/api/admin/mvp/session', 'POST', { matchLabel, candidates: buildCandidates() })}
              >
                Crear ({selectedIds.size} jugadores)
              </button>
              <button
                className="px-4 py-2.5 rounded-[10px] bg-ceuta-bg-mid text-ceuta-black text-[12px] font-bold"
                onClick={() => { setCreating(false); setSelectedIds(new Set()) }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            className="admin-btn admin-btn-light w-full"
            onClick={() => { setCreating(true); setMsg(null) }}
          >
            <span className="admin-btn-emoji">⭐</span>
            <span className="admin-btn-label">Nueva votación MVP</span>
          </button>
        )
      )}
    </div>
  )
}
