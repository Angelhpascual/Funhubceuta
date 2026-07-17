'use client'

import { useEffect, useState } from 'react'
import { LiveSimulator } from './LiveSimulator'

type Status = 'idle' | 'loading' | 'active' | 'error'

const SCENARIOS = [
  { id: 'pre',            label: 'Previo' },
  { id: 'live_0_0',       label: 'En vivo 0-0' },
  { id: 'live_goal_ceuta',label: 'Gol Ceuta 0-1' },
  { id: 'live_goal_rival', label: 'Gol rival 1-0' },
  { id: 'live_events',    label: 'Múltiples eventos' },
  { id: 'win',            label: 'Victoria 0-2' },
  { id: 'draw',           label: 'Empate 1-1' },
  { id: 'loss',           label: 'Derrota 2-0' },
]

export function LiveControl() {
  const [status, setStatus] = useState<Status>('loading')
  const [scheduleId, setScheduleId] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
  const [mockLoading, setMockLoading] = useState<string | null>(null)
  const [mockActive, setMockActive] = useState<string | null>(null)

  const fetch_ = (url: string, opts?: RequestInit) => fetch(url, opts)

  async function setMock(scenario: string) {
    setMockLoading(scenario)
    await fetch_('/api/admin/live-mock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    })
    setMockActive(scenario === 'clear' ? null : scenario)
    setMockLoading(null)
  }

  async function load() {
    setStatus('loading')
    try {
      const res = await fetch_('/api/admin/live-control')
      if (!res.ok) { setStatus('error'); return }
      const data = await res.json()
      setStatus(data.active ? 'active' : 'idle')
      setScheduleId(data.scheduleId ?? null)
    } catch {
      setStatus('error')
    }
  }

  useEffect(() => { load() }, [])

  async function activate() {
    setActing(true)
    const res = await fetch_('/api/admin/live-control', { method: 'POST' })
    if (res.ok) await load()
    setActing(false)
  }

  async function deactivate() {
    setActing(true)
    const res = await fetch_('/api/admin/live-control', { method: 'DELETE' })
    if (res.ok) await load()
    setActing(false)
  }

  const isActive = status === 'active'

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

        <button
          onClick={isActive ? deactivate : activate}
          disabled={acting || status === 'loading'}
          className="w-full rounded-[10px] py-2.5 font-display text-[12px] font-black uppercase tracking-[0.08em] transition-opacity disabled:opacity-40"
          style={{
            background: isActive ? '#fff' : 'var(--red)',
            color: isActive ? 'var(--red)' : '#fff',
          }}
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
      </div>

      {/* ── Gestión del partido — visible siempre ── */}
      <div className="mt-4 rounded-[12px] border border-[var(--border)] bg-white p-4 space-y-3">
        <div className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
          Gestión del partido
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMock('pre')}
            disabled={mockLoading !== null}
            className="flex-1 rounded-[10px] bg-[var(--black)] py-2.5 font-display text-[11px] font-black uppercase tracking-[0.08em] text-white disabled:opacity-40"
          >
            {mockLoading === 'pre' ? '...' : 'Preparar siguiente partido'}
          </button>
          <button
            onClick={() => setMock('clear')}
            disabled={mockLoading !== null}
            className="rounded-[10px] border border-[var(--red)]/30 bg-[var(--red)]/5 px-4 py-2.5 font-display text-[11px] font-black uppercase tracking-[0.08em] text-[var(--red)] disabled:opacity-40"
          >
            {mockLoading === 'clear' ? '...' : 'Limpiar'}
          </button>
        </div>
        <p className="text-[11px] text-[var(--muted)] leading-tight">
          «Preparar siguiente partido» carga el próximo partido de la base de datos en estado previo. «Limpiar» borra todos los datos del mock.
        </p>
      </div>

      {/* ── Simulador de escenarios individuales ── */}
      {process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production' && (
        <div className="mt-5 rounded-[12px] border border-dashed border-[var(--border)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-display text-[10px] font-black uppercase tracking-[0.1em] text-amber-700">
              Solo local / preview
            </span>
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
              Escenario manual
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setMock(s.id)}
                disabled={mockLoading !== null}
                className={`rounded-[8px] border px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.08em] transition-all disabled:opacity-40 ${
                  mockActive === s.id
                    ? 'border-[var(--black)] bg-[var(--black)] text-white'
                    : 'border-[var(--border)] bg-white text-[var(--black)] hover:border-[var(--black)]'
                }`}
              >
                {mockLoading === s.id ? '...' : s.label}
              </button>
            ))}
            <button
              onClick={() => setMock('clear')}
              disabled={mockLoading !== null || mockActive === null}
              className="rounded-[8px] border border-[var(--red)]/30 bg-[var(--red)]/5 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--red)] disabled:opacity-30"
            >
              Limpiar mock
            </button>
          </div>
          {mockActive && (
            <p className="mt-2.5 text-[11px] text-[var(--muted)]">
              Mock activo: <strong className="text-[var(--black)]">{mockActive}</strong> —{' '}
              <a href="/live" target="_blank" className="text-[var(--red)] underline">ver /live</a>
            </p>
          )}

          {/* Simulación automática completa */}
          <LiveSimulator />
        </div>
      )}
    </section>
  )
}
