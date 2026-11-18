'use client'

import { useEffect, useState, useCallback } from 'react'

type ScheduleEntry = {
  path: string
  scheduleId: string
  cron: string
  isPaused: boolean
  lastScheduleTime: number | null
  nextScheduleTime: number | null
}

type Health = {
  scheduled: ScheduleEntry[]
  missing: string[]
  unexpected: ScheduleEntry[]
}

export function SchedulesHealth() {
  const [health, setHealth] = useState<Health | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    const res = await fetch('/api/admin/schedules-health')
    const data = await res.json()
    if (!res.ok || !data.ok) {
      setError(data.error ?? 'Error desconocido')
      setLoading(false)
      return
    }
    setHealth(data)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  if (loading) return (
    <div className="font-display text-[11px] text-ceuta-muted uppercase tracking-widest py-4">Comprobando schedules…</div>
  )

  if (error) return (
    <div className="font-body text-[11px] text-ceuta-red bg-red-50 rounded-lg px-2 py-1.5">✗ {error}</div>
  )

  if (!health) return null

  const allOk = health.missing.length === 0 && health.unexpected.length === 0

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${allOk ? 'bg-[#1E9E4B]' : 'bg-ceuta-red'}`} />
        <span className="font-display text-[11px] font-bold tracking-[0.08em] uppercase text-ceuta-black">
          {allOk ? 'Todos los crons activos' : `${health.missing.length + health.unexpected.length} incidencias`}
        </span>
      </div>

      {health.missing.length > 0 && (
        <div className="bg-red-50 rounded-lg px-2 py-1.5 space-y-1">
          <div className="font-display text-[10px] font-bold text-ceuta-red uppercase tracking-wider">
            Sin schedule activo
          </div>
          {health.missing.map((path) => (
            <div key={path} className="font-body text-[11px] text-ceuta-black truncate">· {path}</div>
          ))}
        </div>
      )}

      {health.unexpected.length > 0 && (
        <div className="bg-amber-50 rounded-lg px-2 py-1.5 space-y-1">
          <div className="font-display text-[10px] font-bold text-amber-700 uppercase tracking-wider">
            Schedule inesperado
          </div>
          {health.unexpected.map((e) => (
            <div key={e.scheduleId} className="font-body text-[11px] text-ceuta-black truncate">
              · {e.path} ({e.cron})
            </div>
          ))}
        </div>
      )}

      <div className="font-display text-[10px] text-ceuta-muted">
        {health.scheduled.length} schedule{health.scheduled.length !== 1 ? 's' : ''} en QStash
      </div>
    </div>
  )
}
