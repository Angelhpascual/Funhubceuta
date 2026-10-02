'use client'

import { useEffect, useState } from 'react'
import { invalidateNavSlotCache } from '@/hooks/useNavSlot'
import { MatchManagementCard } from './live/MatchManagementCard'
import { TiendaMercadoToggle } from './live/TiendaMercadoToggle'
import { LiveScenarioSimulator, SCENARIOS } from './live/LiveScenarioSimulator'

type Status = 'idle' | 'loading' | 'active' | 'error'

type LastResult = {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  savedAt: string
}

export function LiveControl() {
  const [status, setStatus] = useState<Status>('loading')
  const [scheduleId, setScheduleId] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [mockLoading, setMockLoading] = useState<string | null>(null)
  const [mockActive, setMockActive] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<LastResult | null>(null)
  const [clearingResult, setClearingResult] = useState(false)
  const [tiendaActive, setTiendaActive] = useState<boolean | null>(null)
  const [savingTienda, setSavingTienda] = useState(false)
  const [disallowedSending, setDisallowedSending] = useState<'ceuta' | 'rival' | null>(null)

  async function sendGoalDisallowed(team: 'ceuta' | 'rival') {
    setDisallowedSending(team)
    try {
      await fetch('/api/admin/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'goal-disallowed', payload: { team } }),
      })
    } finally {
      setDisallowedSending(null)
    }
  }

  async function setMock(scenario: string) {
    setMockLoading(scenario)
    await fetch('/api/admin/live-mock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    })
    // Send push notification if this scenario has one
    const s = SCENARIOS.find(sc => sc.id === scenario)
    if (s?.push) {
      await fetch('/api/admin/live-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rival: 'FC Andorra', ...s.push }),
      })
    }
    setMockActive(scenario === 'clear' ? null : scenario)
    setMockLoading(null)
  }

  async function load() {
    setStatus('loading')
    try {
      const res = await fetch('/api/admin/live-control')
      if (!res.ok) { setStatus('error'); return }
      const data = await res.json()
      setStatus(data.active ? 'active' : 'idle')
      setScheduleId(data.scheduleId ?? null)
      setLastResult(data.lastResult ?? null)
    } catch {
      setStatus('error')
    }
  }

  useEffect(() => {
    load()
    fetch('/api/admin/merchan-toggle')
      .then(r => r.json())
      .then(d => setTiendaActive(d.mercadoActive === false))
      .catch(() => {})
  }, [])

  async function toggleTienda() {
    if (tiendaActive === null) return
    setSavingTienda(true)
    const next = !tiendaActive
    await fetch('/api/admin/merchan-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mercadoActive: !next }),
    })
    setTiendaActive(next)
    setSavingTienda(false)
    invalidateNavSlotCache()
  }

  async function activate() {
    setActing(true)
    setActionError(null)
    try {
      const res = await fetch('/api/admin/live-control', { method: 'POST' })
      if (res.ok) {
        await load()
        invalidateNavSlotCache()
      } else {
        const data = await res.json().catch(() => null)
        setActionError(
          res.status === 401
            ? 'Sesión de admin caducada — vuelve a iniciar sesión'
            : (data?.error ?? `Error al activar (${res.status})`)
        )
      }
    } catch {
      setActionError('Error de red al activar')
    }
    setActing(false)
  }

  async function deactivate() {
    setActing(true)
    setActionError(null)
    try {
      const res = await fetch('/api/admin/live-control', { method: 'DELETE' })
      if (res.ok) {
        await load()
        invalidateNavSlotCache()
      } else {
        const data = await res.json().catch(() => null)
        setActionError(
          res.status === 401
            ? 'Sesión de admin caducada — vuelve a iniciar sesión'
            : (data?.error ?? `Error al desactivar (${res.status})`)
        )
      }
    } catch {
      setActionError('Error de red al desactivar')
    }
    setActing(false)
  }

  async function toggleResult() {
    setClearingResult(true)
    if (lastResult) {
      await fetch('/api/admin/live-control', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    } else {
      await fetch('/api/admin/live-control', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate_result' }),
      })
    }
    await load()
    setClearingResult(false)
  }

  const isActive = status === 'active'

  // Determine banner state: 1=next match, 2=live, 3=recent result
  const bannerState = isActive ? 2 : lastResult ? 3 : 1
  const bannerLabels: Record<number, string> = {
    1: 'Próximo partido',
    2: 'En directo',
    3: 'Resultado reciente',
  }

  return (
    <section>
      <div className="sec-header">
        <div className="sec-title">Modo Live</div>
      </div>

      <div className={`stat-tile ${isActive ? 'red' : 'dark'} relative overflow-hidden`}>
        {/* Pulsing indicator when active */}
        {isActive && (
          <span className="absolute right-4 top-4 flex size-2.5 items-center justify-center">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-white" />
          </span>
        )}

        <div className="mb-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-70 text-white">
            {status === 'loading' ? 'Cargando...' : isActive ? 'EN VIVO' : 'INACTIVO'}
          </div>
          <div className="mt-1 font-display text-[22px] font-black uppercase leading-tight text-white">
            {isActive ? 'Partido activo' : 'Sin partido'}
          </div>
          {isActive && scheduleId && (
            <div className="mt-1 font-mono text-[10px] opacity-40">
              Schedule: {scheduleId.slice(0, 16)}…
            </div>
          )}
        </div>

        <button type="button"
          onClick={isActive ? deactivate : activate}
          disabled={acting || status === 'loading'}
          className={`w-full rounded-[10px] py-2.5 font-display text-[12px] font-black uppercase tracking-[0.08em] transition-opacity disabled:opacity-40 ${
            isActive ? 'bg-white text-ceuta-red' : 'bg-ceuta-red text-white'
          }`}
        >
          {acting
            ? '...'
            : status === 'loading'
              ? 'Cargando...'
              : isActive
                ? 'Desactivar modo live'
                : 'Activar modo live'}
        </button>

        {status === 'error' && (
          <p className="mt-2 text-[11px] text-white/60">Error al cargar estado</p>
        )}
        {actionError && (
          <p className="mt-2 text-[11px] font-bold text-white">⚠️ {actionError}</p>
        )}
      </div>

      {/* ── Estado del banner de inicio ── */}
      <div className="mt-4 rounded-[12px] border border-ceuta-border bg-white p-4">
        <div className="mb-3 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ceuta-muted">
          Estado del banner de inicio
        </div>

        {/* State pills */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 rounded-[8px] py-2 text-center font-display text-[10px] font-black uppercase tracking-[0.08em] transition-all ${
                bannerState === s
                  ? s === 2
                    ? 'bg-ceuta-red text-white'
                    : 'bg-ceuta-black text-white'
                  : 'bg-ceuta-bg-soft text-ceuta-muted'
              }`}
            >
              <div className="text-[8px] opacity-60 mb-0.5">Estado {s}</div>
              {bannerLabels[s]}
            </div>
          ))}
        </div>

        {/* Current state info + action */}
        {bannerState === 1 && (
          <p className="text-[12px] text-ceuta-muted leading-tight">
            Mostrando la fecha del próximo partido. Activa el modo live para cambiar al estado 2.
          </p>
        )}
        {bannerState === 2 && (
          <p className="text-[12px] text-ceuta-muted leading-tight">
            Banner en modo live. Desactiva el modo live para volver al estado 1 o 3.
          </p>
        )}
        {/* State 3 toggle */}
        <div className="mt-4 pt-3 border-t border-ceuta-border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-display text-[12px] font-black uppercase tracking-[0.06em] text-ceuta-black">
                Resultado reciente
              </div>
              <div className="text-[11px] text-ceuta-muted leading-tight mt-0.5">
                Muestra el resultado del último partido en el banner
              </div>
            </div>
            <button type="button"
              onClick={toggleResult}
              disabled={clearingResult || status === 'loading'}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-40 ${
                lastResult ? 'bg-ceuta-black' : 'bg-ceuta-border'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  lastResult ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {lastResult && (
            <div className="rounded-[8px] bg-ceuta-bg-soft px-3 py-2 text-center">
              <div className="font-display text-[15px] font-black text-ceuta-black">
                {lastResult.homeScore} – {lastResult.awayScore}
              </div>
              <div className="font-display text-[10px] uppercase text-ceuta-muted mt-0.5">
                {lastResult.homeTeam} vs {lastResult.awayTeam}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Gestión del partido — visible siempre ── */}
      <MatchManagementCard
        mockLoading={mockLoading}
        disallowedSending={disallowedSending}
        onPrepareNext={() => setMock('pre')}
        onClearMock={() => setMock('clear')}
        onSendDisallowed={sendGoalDisallowed}
      />

      {/* ── Slot nav: Tienda / Mercado ── */}
      <TiendaMercadoToggle
        tiendaActive={tiendaActive}
        savingTienda={savingTienda}
        onToggle={toggleTienda}
      />

      {/* ── Simulador de escenarios individuales ── */}
      <LiveScenarioSimulator
        mockLoading={mockLoading}
        mockActive={mockActive}
        onSetMock={setMock}
      />
    </section>
  )
}
