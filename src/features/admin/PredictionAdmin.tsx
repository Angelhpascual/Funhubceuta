'use client'

import { useState, useEffect } from 'react'
import { TEAMS_2627 } from '@/data/teams2627'
import type { PredictionSession } from '@/domain/predictions/PredictionSession'
import { MatchFormPreview } from './MatchFormPreview'
import { LogoPicker } from './LogoPicker'

type Vote = { nickname: string | null; fingerprint: string; home_score: number; away_score: number; points: number | null }
type HistorySession = { id: string; match_label: string; jornada: string | null; result: { home: number; away: number } | null; closed_at: string | null; votes: Vote[] }
type SeasonEntry = { fingerprint: string; nickname: string | null; points: number; exactos: number }

const CEUTA = { name: 'AD Ceuta', logo: '/escudo.webp' }

export function PredictionAdmin() {
  const [activeSession, setActiveSession] = useState<PredictionSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [history, setHistory] = useState<HistorySession[]>([])
  const [seasonRanking, setSeasonRanking] = useState<SeasonEntry[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // form state
  const [rivalName, setRivalName] = useState('')
  const [rivalLogo, setRivalLogo] = useState<string | null>(null)
  const [jornada, setJornada] = useState('')
  const [ceutaHome, setCeutaHome] = useState(true)
  const [showLogoPicker, setShowLogoPicker] = useState(false)

  // cierre state
  const [homeResult, setHomeResult] = useState(0)
  const [awayResult, setAwayResult] = useState(0)

  const teams = TEAMS_2627.filter(t => t.name !== CEUTA.name)

  const matchLabel = rivalName
    ? ceutaHome ? `AD Ceuta vs ${rivalName}` : `${rivalName} vs AD Ceuta`
    : ''

  const matchMeta = ceutaHome
    ? { home: CEUTA, away: { name: rivalName, logo: rivalLogo } }
    : { home: { name: rivalName, logo: rivalLogo }, away: CEUTA }

  async function load() {
    try {
      const res = await fetch('/api/predictions/active')
      const data = await res.json()
      setActiveSession(data.session)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(); loadHistory() }, [])

  async function loadHistory() {
    const res = await fetch('/api/admin/predictions/history')
    const data = await res.json()
    setHistory(data.history ?? [])
    setSeasonRanking(data.seasonRanking ?? [])
  }

  async function apiCall(path: string, method: string, body: unknown) {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setMsg(`Error: ${data.error ?? 'desconocido'}`) }
      else { setMsg('✅ Hecho'); await load(); await loadHistory(); setCreating(false) }
    } catch { setMsg('Error de red') }
    finally { setBusy(false) }
  }

  if (loading) return <div className="text-[12px] text-ceuta-muted">Cargando predicciones…</div>

  return (
    <div className="space-y-4">
      <div className="font-display text-[13px] font-bold uppercase tracking-widest text-ceuta-muted">Predicción de resultado</div>

      {msg && (
        <div className={`text-[12px] font-semibold rounded-xl px-3 py-2 ${msg.startsWith('✅') ? 'bg-[#E7F6EC] text-[#1E9E4B]' : 'bg-red-50 text-ceuta-red'}`}>
          {msg}
        </div>
      )}

      {/* Sin sesión activa */}
      {!activeSession && !creating && (
        <button
          className="w-full py-3 rounded-xl border-[1.5px] border-dashed border-ceuta-border font-display text-[12px] font-bold tracking-[0.1em] uppercase text-ceuta-muted hover:border-ceuta-black hover:text-ceuta-black transition-colors"
          onClick={() => setCreating(true)}
        >
          + Nueva predicción
        </button>
      )}

      {/* Formulario creación */}
      {!activeSession && creating && (
        <div className="rounded-[14px] border border-ceuta-border p-4 space-y-4">
          <div className="text-[13px] font-bold text-ceuta-black">Nueva predicción</div>

          {/* Toggle casa/fuera */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCeutaHome(h => !h)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-ceuta-border bg-ceuta-bg-soft text-[10px] font-bold text-ceuta-black"
            >
              {ceutaHome ? '🏠 Local' : '✈️ Visitante'}
              <span className="text-ceuta-muted text-[9px]">(cambiar)</span>
            </button>
          </div>

          {/* Preview */}
          <MatchFormPreview ceutaHome={ceutaHome} rivalName={rivalName} rivalLogo={rivalLogo} />

          {/* Selector rival */}
          <select
            className="w-full px-3 py-2 rounded-[10px] border border-ceuta-border text-[12px] bg-white text-ceuta-black"
            value={rivalName}
            onChange={e => {
              const name = e.target.value
              setRivalName(name)
              const found = teams.find(t => t.name === name)
              if (found) setRivalLogo(found.logo)
            }}
          >
            <option value="">Selecciona el rival…</option>
            {teams.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>

          {/* Escudo picker */}
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted mb-1">
              Escudo del rival {rivalLogo ? '✓' : '(opcional)'}
            </div>
            <button
              type="button"
              className="w-full px-3 py-2 rounded-[10px] border border-ceuta-border text-[11px] text-ceuta-muted bg-ceuta-bg-soft text-left"
              onClick={() => setShowLogoPicker(p => !p)}
            >
              {rivalLogo ? 'Cambiar escudo' : 'Elegir escudo →'}
            </button>
            {showLogoPicker && (
              <LogoPicker
                teams={teams}
                selectedLogo={rivalLogo}
                onSelect={(logo) => { setRivalLogo(logo); setShowLogoPicker(false) }}
              />
            )}
          </div>

          {/* Jornada */}
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted mb-1">Jornada (opcional)</div>
            <input
              className="w-full px-3 py-2 rounded-[10px] border border-ceuta-border text-[12px] bg-white text-ceuta-black"
              placeholder="Ej: Jornada 1 · 2026-27"
              value={jornada}
              onChange={e => setJornada(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 py-2.5 rounded-[10px] bg-ceuta-black text-white text-[12px] font-bold uppercase disabled:opacity-40"
              disabled={busy || !rivalName}
              onClick={() => apiCall('/api/admin/predictions/session', 'POST', { matchLabel, jornada, matchMeta })}
            >
              Crear predicción
            </button>
            <button
              className="px-4 py-2.5 rounded-[10px] bg-ceuta-bg-mid text-ceuta-black text-[12px] font-bold"
              onClick={() => setCreating(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Sesión activa — tarjeta negra */}
      {activeSession && (
        <div className={`rounded-[14px] p-4 space-y-3 ${activeSession.status !== 'pending' ? 'bg-ceuta-black text-white' : 'bg-ceuta-bg-soft border border-ceuta-border'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className={`font-display text-[10px] font-bold tracking-[0.14em] uppercase mb-0.5 ${activeSession.status !== 'pending' ? 'text-white/50' : 'text-ceuta-muted'}`}>Quiniela activa</div>
              <div className={`font-display font-black text-[18px] uppercase leading-tight truncate ${activeSession.status !== 'pending' ? 'text-white' : 'text-ceuta-black'}`}>{activeSession.match_label}</div>
              {activeSession.jornada && <div className={`font-display text-[11px] mt-0.5 ${activeSession.status !== 'pending' ? 'text-white/50' : 'text-ceuta-muted'}`}>{activeSession.jornada}</div>}
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

          {activeSession.status === 'pending' && (
            <button
              className="w-full py-2.5 rounded-xl font-display text-[12px] font-bold tracking-[0.08em] uppercase bg-[#1E9E4B] text-white disabled:opacity-40 transition-opacity"
              disabled={busy}
              onClick={() => apiCall('/api/admin/predictions/session', 'PUT', { sessionId: activeSession.id, action: 'open' })}
            >
              {busy ? '⏳' : '▶ Abrir predicción'}
            </button>
          )}

          {activeSession.status === 'open' && (
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-ceuta-muted">Resultado final</div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-[9px] text-ceuta-muted mb-1">{activeSession.match_meta?.home.name ?? 'Local'}</div>
                  <div className="flex items-center gap-1.5">
                    <button className="w-7 h-7 rounded-full border border-ceuta-border text-[14px] font-bold" onClick={() => setHomeResult(h => Math.max(0, h - 1))}>−</button>
                    <div className="w-10 h-10 rounded-[8px] bg-ceuta-black text-white flex items-center justify-center font-black text-[18px]">{homeResult}</div>
                    <button className="w-7 h-7 rounded-full border border-ceuta-border text-[14px] font-bold" onClick={() => setHomeResult(h => Math.min(9, h + 1))}>+</button>
                  </div>
                </div>
                <div className="text-[18px] font-black text-ceuta-muted pb-2">:</div>
                <div className="flex-1">
                  <div className="text-[9px] text-ceuta-muted mb-1">{activeSession.match_meta?.away.name ?? 'Visitante'}</div>
                  <div className="flex items-center gap-1.5">
                    <button className="w-7 h-7 rounded-full border border-ceuta-border text-[14px] font-bold" onClick={() => setAwayResult(a => Math.max(0, a - 1))}>−</button>
                    <div className="w-10 h-10 rounded-[8px] bg-ceuta-black text-white flex items-center justify-center font-black text-[18px]">{awayResult}</div>
                    <button className="w-7 h-7 rounded-full border border-ceuta-border text-[14px] font-bold" onClick={() => setAwayResult(a => Math.min(9, a + 1))}>+</button>
                  </div>
                </div>
              </div>
              <button
                className="w-full py-2.5 rounded-xl font-display text-[12px] font-bold tracking-[0.08em] uppercase bg-ceuta-red text-white disabled:opacity-40 transition-opacity"
                disabled={busy}
                onClick={() => apiCall('/api/admin/predictions/close', 'POST', { sessionId: activeSession.id, homeResult, awayResult })}
              >
                {busy ? '⏳' : `■ Cerrar con resultado ${homeResult}-${awayResult}`}
              </button>
            </div>
          )}

          {activeSession.status === 'closed' && activeSession.result && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-4 bg-white/8 rounded-[10px] py-3">
                <div className="font-display text-[10px] font-bold tracking-[0.1em] uppercase text-white/50">{activeSession.match_meta?.home.name ?? 'Local'}</div>
                <div className="font-display font-black text-[28px] text-white">{activeSession.result.home} — {activeSession.result.away}</div>
                <div className="font-display text-[10px] font-bold tracking-[0.1em] uppercase text-white/50">{activeSession.match_meta?.away.name ?? 'Visitante'}</div>
              </div>
              <button
                className="w-full py-2.5 rounded-xl font-display text-[12px] font-bold tracking-[0.08em] uppercase bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 transition-all"
                disabled={busy}
                onClick={() => apiCall('/api/admin/predictions/archive', 'POST', { sessionId: activeSession.id })}
              >
                Ocultar banner
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ranking temporada */}
      {seasonRanking.length > 0 && (
        <div>
          <div className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-ceuta-muted mb-2">🏅 Ranking temporada</div>
          <div className="space-y-1.5">
            {seasonRanking.slice(0, 10).map((p, i) => (
              <div key={p.fingerprint} className="flex items-center gap-3 px-3 py-2.5 bg-ceuta-bg-soft rounded-xl border border-ceuta-border">
                <div className="font-display text-[11px] font-black text-ceuta-muted w-4 text-center shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[12px] font-bold text-ceuta-black truncate">@{p.nickname ?? 'anónimo'}</div>
                  <div className="font-display text-[10px] text-ceuta-muted">{p.exactos} exacto{p.exactos !== 1 ? 's' : ''}</div>
                </div>
                <div className="font-display text-[14px] font-black text-ceuta-gold shrink-0">{p.points} pts</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      {history.length > 0 && (
        <div>
          <div className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-ceuta-muted mb-2">Historial</div>
          <div className="space-y-1.5">
            {history.map(s => (
              <div key={s.id} className="rounded-xl border border-ceuta-border overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left bg-ceuta-bg-soft hover:bg-ceuta-bg-mid transition-colors"
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[12px] font-bold text-ceuta-black truncate">{s.match_label}</div>
                    {s.jornada && <div className="font-display text-[10px] text-ceuta-muted">{s.jornada}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {s.result && <span className="font-display font-black text-[13px] text-ceuta-black">{s.result.home}—{s.result.away}</span>}
                    <span className="font-display text-[10px] text-ceuta-muted">{s.votes.length} votos</span>
                    <span className="text-ceuta-muted text-[10px]">{expandedId === s.id ? '▲' : '▼'}</span>
                  </div>
                </button>

                {expandedId === s.id && (
                  <div className="border-t border-ceuta-border divide-y divide-ceuta-border bg-white">
                    {s.votes.length === 0 && (
                      <div className="px-4 py-3 font-display text-[11px] text-ceuta-muted">Sin votos registrados</div>
                    )}
                    {s.votes.map((v, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-[10px] text-ceuta-muted w-4">{i + 1}</span>
                          <span className="font-display text-[12px] font-bold text-ceuta-black">@{v.nickname ?? 'anónimo'}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-display font-black text-[12px] text-ceuta-black">{v.home_score}—{v.away_score}</span>
                          <span className={`font-display text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                            v.points === 50 ? 'bg-[#E7F6EC] text-[#1E9E4B]' :
                            v.points === 15 ? 'bg-amber-50 text-amber-700' :
                            'bg-ceuta-bg-mid text-ceuta-muted'
                          }`}>
                            {v.points != null ? `+${v.points}` : '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
