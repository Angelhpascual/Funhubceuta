'use client'

import { useState, useEffect } from 'react'
import { TEAMS_2627 } from '@/lib/teams2627'

type Candidate = { id: string; name: string; number: number; position: string; photo_url?: string }
type Session = {
  id: string
  match_label: string
  match_meta: { home: { name: string; logo: string | null }; away: { name: string; logo: string | null } } | null
  status: 'pending' | 'open' | 'closed'
  winner_name: string | null
  winner_votes: number | null
  candidates: Candidate[]
  opened_at: string | null
  closed_at: string | null
}
type VoteTally = { candidate_id: string; count: number }
type HistoryEntry = { id: string; match_label: string; winner_name: string | null; winner_votes: number | null; closed_at: string | null }
type SquadPlayer = { id: string; name: string; dorsal: number; position: string; position_group: string; photo_url?: string }
type StandingTeam = { name: string; logo: string | null }

const CEUTA = { name: 'AD Ceuta', logo: '/escudo.webp' }

export function MvpAdmin() {
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [tallies, setTallies] = useState<VoteTally[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [matchLabel, setMatchLabel] = useState('')
  const [squad, setSquad] = useState<SquadPlayer[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const teams: StandingTeam[] = TEAMS_2627.filter(t => t.name !== CEUTA.name)
  const [awayName, setAwayName] = useState('')
  const [awayLogo, setAwayLogo] = useState<string | null>(null)
  const [showLogoPicker, setShowLogoPicker] = useState(false)
  const [ceutaHome, setCeutaHome] = useState(true)

  async function load() {
    try {
      const [activeRes, histRes] = await Promise.all([
        fetch('/api/mvp/active'),
        fetch('/api/mvp/history'),
      ])
      const activeData = await activeRes.json()
      const histData = await histRes.json()
      setActiveSession(activeData.session)
      setTallies(activeData.tallies ?? [])
      setHistory(histData.history ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function loadSquad() {
    try {
      const res = await fetch('/api/squad')
      const data = await res.json()
      const players: SquadPlayer[] = (data.grouped ?? []).flatMap((g: { players: SquadPlayer[] }) => g.players)
      setSquad(players)
    } catch { /* ignore */ }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (creating) loadSquad() }, [creating])

  async function apiCall(path: string, method: string, body: unknown) {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) {
        setMsg(`✗ ${data.error ?? 'Error desconocido'}`)
      } else {
        setMsg('✓ Hecho')
        await load()
        setCreating(false)
        setSelectedIds(new Set())
        setMatchLabel(''); setAwayName(''); setAwayLogo(null); setShowLogoPicker(false)
        setTimeout(() => setMsg(null), 3000)
      }
    } catch {
      setMsg('✗ Error de red')
    } finally {
      setBusy(false)
    }
  }

  function togglePlayer(id: string) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  function buildCandidates(): Candidate[] {
    return squad.filter(p => selectedIds.has(p.id)).map(p => ({
      id: p.id, name: p.name, number: p.dorsal,
      position: p.position_group.slice(0, 3).toUpperCase(),
      photo_url: p.photo_url,
    }))
  }

  const posOrder = ['Porteros', 'Defensas', 'Centrocampistas', 'Delanteros']
  const grouped = posOrder.map(pos => ({ pos, players: squad.filter(p => p.position_group === pos) })).filter(g => g.players.length > 0)
  const totalVotes = tallies.reduce((a, t) => a + t.count, 0)

  if (loading) return <div className="text-[12px] text-ceuta-muted py-4 text-center">Cargando...</div>

  return (
    <div className="space-y-4">

      {/* Sesión activa — tarjeta negra */}
      {activeSession && (
        <div className={`rounded-[14px] p-4 space-y-3 ${
          activeSession.status === 'open' ? 'bg-ceuta-black text-white' :
          activeSession.status === 'closed' ? 'bg-ceuta-black text-white' :
          'bg-ceuta-bg-soft border border-ceuta-border'
        }`}>
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className={`font-display text-[10px] font-bold tracking-[0.14em] uppercase mb-0.5 ${activeSession.status !== 'pending' ? 'text-white/50' : 'text-ceuta-muted'}`}>
                Sesión activa
              </div>
              <div className={`font-display font-black text-[18px] uppercase leading-tight truncate ${activeSession.status !== 'pending' ? 'text-white' : 'text-ceuta-black'}`}>
                {activeSession.match_label}
              </div>
            </div>
            <span className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full font-display text-[10px] font-bold tracking-[0.1em] uppercase ${
              activeSession.status === 'open' ? 'bg-[#1E9E4B] text-white' :
              activeSession.status === 'closed' ? 'bg-white/10 text-white/70' :
              'bg-ceuta-bg-mid text-ceuta-muted'
            }`}>
              {activeSession.status === 'open' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              {activeSession.status === 'pending' ? 'Pendiente' : activeSession.status === 'open' ? 'Abierta' : 'Cerrada'}
            </span>
          </div>

          {/* Ganador (closed) */}
          {activeSession.status === 'closed' && activeSession.winner_name && (
            <div className="flex items-center gap-3 bg-white/8 rounded-[10px] px-3 py-2.5">
              <div className="w-8 h-8 rounded-full bg-ceuta-gold flex items-center justify-center font-display text-[12px] font-black text-ceuta-black shrink-0">
                ★
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-[10px] font-bold tracking-[0.12em] uppercase text-ceuta-gold">MVP</div>
                <div className="font-display font-black text-[16px] text-white truncate">{activeSession.winner_name}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display font-black text-[20px] text-white">{activeSession.winner_votes}</div>
                <div className="font-display text-[9px] text-white/50 uppercase tracking-wide">votos</div>
              </div>
            </div>
          )}

          {/* Candidatos con barras de voto (open) */}
          {activeSession.status === 'open' && activeSession.candidates.length > 0 && (
            <div className="space-y-1.5">
              {activeSession.candidates.map((c) => {
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
          {activeSession.status === 'pending' && (
            <div className="flex flex-wrap gap-1.5">
              {activeSession.candidates.map(c => (
                <span key={c.id} className="font-display text-[11px] font-bold px-2.5 py-1 rounded-full bg-ceuta-bg-mid text-ceuta-black border border-ceuta-border">
                  #{c.number} {c.name}
                </span>
              ))}
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-1">
            {activeSession.status === 'pending' && (
              <button
                disabled={busy}
                onClick={() => apiCall('/api/admin/mvp/session', 'PATCH', { sessionId: activeSession.id, action: 'open' })}
                className="flex-1 py-2.5 rounded-xl font-display text-[12px] font-bold tracking-[0.08em] uppercase bg-[#1E9E4B] text-white disabled:opacity-40 transition-opacity"
              >
                {busy ? '⏳' : '▶ Abrir votación'}
              </button>
            )}
            {activeSession.status === 'open' && (
              <button
                disabled={busy}
                onClick={() => apiCall('/api/admin/mvp/session', 'PATCH', { sessionId: activeSession.id, action: 'close' })}
                className="flex-1 py-2.5 rounded-xl font-display text-[12px] font-bold tracking-[0.08em] uppercase bg-ceuta-red text-white disabled:opacity-40 transition-opacity"
              >
                {busy ? '⏳' : '■ Cerrar y proclamar MVP'}
              </button>
            )}
            <button
              disabled={busy}
              onClick={() => {
                if (!confirm('¿Quitar el banner del MVP? Se borrará la sesión y sus votos.')) return
                apiCall('/api/admin/mvp/session', 'DELETE', { sessionId: activeSession.id })
              }}
              className={`px-4 py-2.5 rounded-xl font-display text-[12px] font-bold tracking-[0.08em] uppercase disabled:opacity-40 transition-opacity ${
                activeSession.status !== 'pending' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-ceuta-bg-mid text-ceuta-black border border-ceuta-border hover:border-ceuta-black'
              }`}
            >
              Quitar
            </button>
          </div>
        </div>
      )}

      {/* Feedback */}
      {msg && (
        <div className={`text-[12px] font-semibold px-3 py-2 rounded-xl ${msg.startsWith('✓') ? 'bg-[#E7F6EC] text-[#1E9E4B]' : 'bg-red-50 text-ceuta-red'}`}>
          {msg}
        </div>
      )}

      {/* Formulario nueva sesión */}
      {(!activeSession || activeSession.status === 'closed') && (
        creating ? (
          <div className="rounded-[14px] border border-ceuta-border p-4 space-y-4">
            <div className="text-[13px] font-bold text-ceuta-black">Nueva sesión MVP</div>

            {/* Toggle casa/fuera */}
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { const next = !ceutaHome; setCeutaHome(next); if (awayName) setMatchLabel(next ? `AD Ceuta vs ${awayName}` : `${awayName} vs AD Ceuta`) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-ceuta-border bg-ceuta-bg-soft text-[10px] font-bold text-ceuta-black">
                {ceutaHome ? '🏠 Local' : '✈️ Visitante'} <span className="text-ceuta-muted text-[9px]">(cambiar)</span>
              </button>
            </div>

            {/* Preview partido */}
            <div className="flex items-center justify-center gap-3 py-3 rounded-[12px] bg-ceuta-bg-soft border border-ceuta-border">
              {ceutaHome ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={CEUTA.logo} alt="AD Ceuta" width={32} height={32} className="object-contain" />
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-ceuta-black">AD Ceuta</div>
                    <div className="text-[9px] text-ceuta-muted font-bold uppercase tracking-widest">vs</div>
                    <div className="text-[10px] font-bold text-ceuta-black">{awayName || 'Rival'}</div>
                  </div>
                  {awayLogo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={awayLogo} alt="" width={32} height={32} className="object-contain" />
                    : <div className="w-8 h-8 rounded-full bg-ceuta-bg-mid flex items-center justify-center text-[9px] font-black text-ceuta-muted">{awayName ? awayName.slice(0,3).toUpperCase() : '?'}</div>
                  }
                </>
              ) : (
                <>
                  {awayLogo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={awayLogo} alt="" width={32} height={32} className="object-contain" />
                    : <div className="w-8 h-8 rounded-full bg-ceuta-bg-mid flex items-center justify-center text-[9px] font-black text-ceuta-muted">{awayName ? awayName.slice(0,3).toUpperCase() : '?'}</div>
                  }
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-ceuta-black">{awayName || 'Rival'}</div>
                    <div className="text-[9px] text-ceuta-muted font-bold uppercase tracking-widest">vs</div>
                    <div className="text-[10px] font-bold text-ceuta-black">AD Ceuta</div>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={CEUTA.logo} alt="AD Ceuta" width={32} height={32} className="object-contain" />
                </>
              )}
            </div>

            {/* Selector rival */}
            <select
              className="w-full px-3 py-2 rounded-[10px] border border-ceuta-border text-[12px] bg-white text-ceuta-black"
              value={awayName}
              onChange={(e) => {
                const name = e.target.value
                setAwayName(name)
                setMatchLabel(name ? (ceutaHome ? `AD Ceuta vs ${name}` : `${name} vs AD Ceuta`) : '')
                const found = teams.find(t => t.name === name)
                if (found) setAwayLogo(found.logo)
              }}
            >
              <option value="">Selecciona el rival…</option>
              {teams.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>

            {/* Logo picker */}
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted mb-1">
                Escudo del rival {awayLogo ? '✓' : '(opcional)'}
              </div>
              <button type="button" className="w-full px-3 py-2 rounded-[10px] border border-ceuta-border text-[11px] text-ceuta-muted bg-ceuta-bg-soft text-left"
                onClick={() => setShowLogoPicker(p => !p)}>
                {awayLogo ? 'Cambiar escudo' : 'Elegir escudo →'}
              </button>
              {showLogoPicker && (
                <div className="mt-2 grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 rounded-[10px] bg-ceuta-bg-soft border border-ceuta-border">
                  <button type="button"
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-[8px] border ${!awayLogo ? 'border-ceuta-red bg-red-50' : 'border-transparent'}`}
                    onClick={() => { setAwayLogo(null); setShowLogoPicker(false) }}>
                    <div className="w-8 h-8 rounded-full bg-ceuta-bg-mid flex items-center justify-center text-[8px] font-black text-ceuta-muted">?</div>
                    <span className="text-[8px] text-ceuta-muted">Sin escudo</span>
                  </button>
                  {teams.filter(t => t.logo).map(t => (
                    <button key={t.name} type="button"
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-[8px] border ${awayLogo === t.logo ? 'border-ceuta-red bg-red-50' : 'border-transparent'}`}
                      onClick={() => { setAwayLogo(t.logo); setShowLogoPicker(false) }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.logo!} alt={t.name} width={32} height={32} className="object-contain" />
                      <span className="text-[8px] text-ceuta-muted text-center leading-tight">{t.name.split(' ').slice(-1)[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Etiqueta */}
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted mb-1">Etiqueta (opcional)</div>
              <input type="text" placeholder="Ej: J1 · 12 Jul" value={matchLabel}
                onChange={(e) => setMatchLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-[10px] border border-ceuta-border text-[12px] bg-white text-ceuta-black" />
            </div>

            {/* Selector jugadores */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted">
                  Candidatos ({selectedIds.size})
                </div>
                {selectedIds.size > 0 && (
                  <button onClick={() => setSelectedIds(new Set())} className="text-[10px] text-ceuta-muted">Limpiar</button>
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
                        {players.map(p => {
                          const sel = selectedIds.has(p.id)
                          return (
                            <button key={p.id} onClick={() => togglePlayer(p.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] font-display text-[11px] font-bold border transition-colors ${
                                sel ? 'bg-ceuta-black text-white border-ceuta-black' : 'bg-ceuta-bg-soft text-ceuta-black border-ceuta-border'
                              }`}>
                              <span className="opacity-60">#{p.dorsal}</span>{p.name}
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
                disabled={busy || !awayName || selectedIds.size < 2}
                onClick={() => apiCall('/api/admin/mvp/session', 'POST', {
                  matchLabel: matchLabel || (ceutaHome ? `AD Ceuta vs ${awayName}` : `${awayName} vs AD Ceuta`),
                  candidates: buildCandidates(),
                  matchMeta: ceutaHome
                    ? { home: CEUTA, away: { name: awayName, logo: awayLogo } }
                    : { home: { name: awayName, logo: awayLogo }, away: CEUTA },
                })}
                className="flex-1 py-2.5 rounded-[10px] bg-ceuta-black text-white text-[12px] font-bold uppercase disabled:opacity-40"
              >
                Crear ({selectedIds.size} jugadores)
              </button>
              <button onClick={() => { setCreating(false); setSelectedIds(new Set()) }}
                className="px-4 py-2.5 rounded-[10px] bg-ceuta-bg-mid text-ceuta-black text-[12px] font-bold">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setCreating(true); setMsg(null) }}
            className="w-full py-3 rounded-xl border-[1.5px] border-dashed border-ceuta-border font-display text-[12px] font-bold tracking-[0.1em] uppercase text-ceuta-muted hover:border-ceuta-black hover:text-ceuta-black transition-colors">
            + Nueva votación MVP
          </button>
        )
      )}

      {/* Historial */}
      {history.length > 0 && (
        <div>
          <div className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-ceuta-muted mb-2">Últimas sesiones</div>
          <div className="space-y-1.5">
            {history.map(h => (
              <div key={h.id} className="flex items-center gap-3 px-3 py-2.5 bg-ceuta-bg-soft rounded-xl border border-ceuta-border">
                <div className="w-5 h-5 rounded-full bg-ceuta-gold flex items-center justify-center font-display text-[9px] font-black text-ceuta-black shrink-0">★</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[12px] font-bold text-ceuta-black truncate">{h.match_label}</div>
                  <div className="font-display text-[10px] text-ceuta-muted">{h.winner_name ?? '—'}</div>
                </div>
                {h.winner_votes != null && (
                  <div className="font-display text-[11px] font-bold text-ceuta-black shrink-0">{h.winner_votes} votos</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
