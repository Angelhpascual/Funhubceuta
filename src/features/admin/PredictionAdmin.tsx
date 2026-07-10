'use client'

import { useState, useEffect } from 'react'
import { TEAMS_2627 } from '@/lib/teams2627'
import type { PredictionSession } from '@/infrastructure/supabase/PredictionRepository'

const CEUTA = { name: 'AD Ceuta', logo: '/escudo.webp' }

export function PredictionAdmin() {
  const [activeSession, setActiveSession] = useState<PredictionSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

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

  useEffect(() => { load() }, [])

  async function apiCall(path: string, method: string, body: unknown) {
    setBusy(true); setMsg(null)
    try {
      const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setMsg(`Error: ${data.error ?? 'desconocido'}`) }
      else { setMsg('✅ Hecho'); await load(); setCreating(false) }
    } catch { setMsg('Error de red') }
    finally { setBusy(false) }
  }

  if (loading) return <div className="text-[12px] text-ceuta-muted">Cargando predicciones…</div>

  return (
    <div className="space-y-4">
      <div className="text-[13px] font-bold uppercase tracking-widest text-ceuta-muted">Predicción de resultado</div>

      {msg && (
        <div className={`text-[12px] font-semibold rounded-[10px] px-3 py-2 ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg}
        </div>
      )}

      {/* Sin sesión activa */}
      {!activeSession && !creating && (
        <button
          className="w-full py-3 rounded-[12px] bg-ceuta-black text-white text-[13px] font-bold uppercase tracking-wide"
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
          <div className="flex items-center justify-center gap-3 py-3 rounded-[12px] bg-ceuta-bg-soft border border-ceuta-border">
            {ceutaHome ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={CEUTA.logo} alt="AD Ceuta" width={32} height={32} className="object-contain" />
                <div className="text-center">
                  <div className="text-[10px] font-bold text-ceuta-black">AD Ceuta</div>
                  <div className="text-[9px] text-ceuta-muted font-bold uppercase tracking-widest">vs</div>
                  <div className="text-[10px] font-bold text-ceuta-black">{rivalName || 'Rival'}</div>
                </div>
                {rivalLogo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={rivalLogo} alt="" width={32} height={32} className="object-contain" />
                  : <div className="w-8 h-8 rounded-full bg-ceuta-bg-mid flex items-center justify-center text-[9px] font-black text-ceuta-muted">{rivalName ? rivalName.slice(0,3).toUpperCase() : '?'}</div>
                }
              </>
            ) : (
              <>
                {rivalLogo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={rivalLogo} alt="" width={32} height={32} className="object-contain" />
                  : <div className="w-8 h-8 rounded-full bg-ceuta-bg-mid flex items-center justify-center text-[9px] font-black text-ceuta-muted">{rivalName ? rivalName.slice(0,3).toUpperCase() : '?'}</div>
                }
                <div className="text-center">
                  <div className="text-[10px] font-bold text-ceuta-black">{rivalName || 'Rival'}</div>
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
              <div className="mt-2 grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 rounded-[10px] bg-ceuta-bg-soft border border-ceuta-border">
                <button
                  type="button"
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-[8px] border ${!rivalLogo ? 'border-ceuta-red bg-red-50' : 'border-transparent'}`}
                  onClick={() => { setRivalLogo(null); setShowLogoPicker(false) }}
                >
                  <div className="w-8 h-8 rounded-full bg-ceuta-bg-mid flex items-center justify-center text-[8px] font-black text-ceuta-muted">?</div>
                  <span className="text-[8px] text-ceuta-muted">Sin escudo</span>
                </button>
                {teams.filter(t => t.logo).map(t => (
                  <button
                    key={t.name}
                    type="button"
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-[8px] border ${rivalLogo === t.logo ? 'border-ceuta-red bg-red-50' : 'border-transparent'}`}
                    onClick={() => { setRivalLogo(t.logo); setShowLogoPicker(false) }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.logo!} alt={t.name} width={32} height={32} className="object-contain" />
                    <span className="text-[8px] text-ceuta-muted text-center leading-tight">{t.name.split(' ').slice(-1)[0]}</span>
                  </button>
                ))}
              </div>
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

      {/* Sesión activa — controles */}
      {activeSession && (
        <div className="rounded-[14px] border border-ceuta-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-bold text-ceuta-black">{activeSession.match_label}</div>
              {activeSession.jornada && <div className="text-[10px] text-ceuta-muted mt-0.5">{activeSession.jornada}</div>}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-[6px] ${
              activeSession.status === 'open' ? 'bg-green-100 text-green-700' :
              activeSession.status === 'closed' ? 'bg-ceuta-bg-mid text-ceuta-muted' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {activeSession.status === 'pending' ? 'Pendiente' : activeSession.status === 'open' ? 'Abierta' : 'Cerrada'}
            </span>
          </div>

          {activeSession.status === 'pending' && (
            <button
              className="w-full py-2.5 rounded-[10px] bg-green-600 text-white text-[12px] font-bold uppercase disabled:opacity-40"
              disabled={busy}
              onClick={() => apiCall('/api/admin/predictions/session', 'PUT', { sessionId: activeSession.id, action: 'open' })}
            >
              Abrir predicción
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
                className="w-full py-2.5 rounded-[10px] bg-ceuta-red text-white text-[12px] font-bold uppercase disabled:opacity-40"
                disabled={busy}
                onClick={() => apiCall('/api/admin/predictions/close', 'POST', { sessionId: activeSession.id, homeResult, awayResult })}
              >
                Cerrar con resultado {homeResult}-{awayResult}
              </button>
            </div>
          )}

          {activeSession.status === 'closed' && activeSession.result && (
            <div className="text-center py-2">
              <div className="text-[11px] text-ceuta-muted mb-1">Resultado final</div>
              <div className="text-[22px] font-black text-ceuta-black">
                {activeSession.result.home} — {activeSession.result.away}
              </div>
              <button
                className="mt-3 w-full py-2.5 rounded-[10px] bg-ceuta-black text-white text-[12px] font-bold uppercase"
                onClick={() => setCreating(true)}
              >
                + Nueva predicción
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
