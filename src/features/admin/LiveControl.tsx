'use client'

import { useEffect, useState } from 'react'

type Status = 'idle' | 'loading' | 'active' | 'error'

export function LiveControl() {
  const [status, setStatus] = useState<Status>('loading')
  const [scheduleId, setScheduleId] = useState<string | null>(null)
  const [acting, setActing] = useState(false)

  const fetch_ = (url: string, opts?: RequestInit) => fetch(url, opts)

  async function load() {
    setStatus('loading')
    const res = await fetch_('/api/admin/live-control')
    if (!res.ok) { setStatus('error'); return }
    const data = await res.json()
    setStatus(data.active ? 'active' : 'idle')
    setScheduleId(data.scheduleId ?? null)
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
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-70">
            {status === 'loading' ? 'Cargando...' : isActive ? 'EN VIVO' : 'INACTIVO'}
          </div>
          <div className="mt-1 font-display text-[22px] font-black uppercase leading-tight">
            {isActive ? 'Partido activo' : 'Sin partido'}
          </div>
          {isActive && scheduleId && (
            <div className="mt-1 font-mono text-[10px] opacity-40">
              Schedule: {scheduleId.slice(0, 16)}…
            </div>
          )}
        </div>

        {status !== 'loading' && (
          <button
            onClick={isActive ? deactivate : activate}
            disabled={acting}
            className={`w-full rounded-[10px] py-2.5 font-display text-[12px] font-black uppercase tracking-[0.08em] transition-opacity disabled:opacity-40 ${
              isActive
                ? 'bg-white text-ceuta-red'
                : 'bg-ceuta-red text-white'
            }`}
          >
            {acting
              ? '...'
              : isActive
                ? 'Desactivar modo live'
                : 'Activar modo live'}
          </button>
        )}

        {status === 'error' && (
          <p className="mt-2 text-[11px] text-white/60">Error al cargar estado</p>
        )}
      </div>
    </section>
  )
}
