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

const POSITIONS = ['POR', 'DEF', 'MED', 'DEL']

const DEFAULT_CANDIDATES: Candidate[] = [
  { id: 'c1', name: '', number: 1, position: 'POR' },
  { id: 'c2', name: '', number: 10, position: 'MED' },
  { id: 'c3', name: '', number: 9, position: 'DEL' },
]

export function MvpAdmin() {
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [matchLabel, setMatchLabel] = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>(DEFAULT_CANDIDATES)

  async function load() {
    try {
      const res = await fetch('/api/mvp/active')
      const data = await res.json()
      setActiveSession(data.session)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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
      }
    } catch {
      setMsg('Error de red')
    } finally {
      setBusy(false)
    }
  }

  function updateCandidate(idx: number, field: keyof Candidate, value: string | number) {
    setCandidates((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  function addCandidate() {
    setCandidates((prev) => [
      ...prev,
      { id: `c${Date.now()}`, name: '', number: 0, position: 'DEL' },
    ])
  }

  function removeCandidate(idx: number) {
    setCandidates((prev) => prev.filter((_, i) => i !== idx))
  }

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
          </div>

          {activeSession.status !== 'closed' && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-ceuta-muted mb-2">Candidatos</div>
              {activeSession.candidates.map((c) => (
                <div key={c.id} className="flex items-center gap-2 py-1">
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
      {!activeSession || activeSession.status === 'closed' ? (
        creating ? (
          <div className="rounded-[14px] border border-ceuta-border p-4 space-y-3">
            <div className="text-[12px] font-bold text-ceuta-black">Nueva sesión MVP</div>

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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ceuta-muted">Candidatos</label>
                <button onClick={addCandidate} className="text-[10px] font-bold text-ceuta-red">+ Añadir</button>
              </div>
              {candidates.map((c, i) => (
                <div key={c.id} className="flex gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="#"
                    value={c.number || ''}
                    onChange={(e) => updateCandidate(i, 'number', parseInt(e.target.value) || 0)}
                    className="w-14 px-2 py-1.5 rounded-[8px] border border-ceuta-border text-[12px] bg-ceuta-bg-soft text-center"
                  />
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={c.name}
                    onChange={(e) => updateCandidate(i, 'name', e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-[8px] border border-ceuta-border text-[12px] bg-ceuta-bg-soft"
                  />
                  <select
                    value={c.position}
                    onChange={(e) => updateCandidate(i, 'position', e.target.value)}
                    className="w-16 px-1 py-1.5 rounded-[8px] border border-ceuta-border text-[11px] bg-ceuta-bg-soft"
                  >
                    {POSITIONS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                  {candidates.length > 2 && (
                    <button onClick={() => removeCandidate(i)} className="text-ceuta-red text-[14px] w-6 shrink-0">✕</button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 py-2.5 rounded-[10px] bg-ceuta-red text-white text-[12px] font-bold uppercase disabled:opacity-40"
                disabled={busy || !matchLabel || candidates.some((c) => !c.name)}
                onClick={() => apiCall('/api/admin/mvp/session', 'POST', { matchLabel, candidates })}
              >
                Crear sesión
              </button>
              <button
                className="px-4 py-2.5 rounded-[10px] bg-ceuta-bg-mid text-ceuta-black text-[12px] font-bold"
                onClick={() => setCreating(false)}
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
      ) : null}
    </div>
  )
}
