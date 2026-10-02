'use client'

import { useRef, useCallback, useEffect } from 'react'
import type React from 'react'

export type Status = 'idle' | 'running' | 'ok' | 'error'

type CronLog = {
  id: number
  created_at: string
  cron_type: string
  status: string
  duration_ms: number
  details: Record<string, unknown>
}

export async function callTrigger(action: string, payload?: unknown) {
  const res = await fetch('/api/admin/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Error')
  return data.result
}

export function useCronPoller() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  return useCallback(
    (cronType: string, since: number, onDone: (log: CronLog) => void, onTimeout: () => void) => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      const deadline = Date.now() + 90_000
      intervalRef.current = setInterval(async () => {
        if (Date.now() > deadline) {
          clearInterval(intervalRef.current!)
          onTimeout()
          return
        }
        try {
          const res = await fetch('/api/admin/activity')
          if (!res.ok) return
          const data = await res.json()
          const logs: CronLog[] = data.logs ?? []
          const found = logs.find(
            (l) => l.cron_type === cronType && new Date(l.created_at).getTime() > since
          )
          if (found) {
            clearInterval(intervalRef.current!)
            onDone(found)
          }
        } catch { /* keep polling */ }
      }, 2500)
    },
    []
  )
}

export function buildResult(log: CronLog): { lines: string[]; ok: boolean } {
  const d = log.details
  const ok = log.status === 'success'
  if (!ok) return { lines: [(d.error as string) ?? 'Error desconocido'], ok: false }

  const lines: string[] = []

  // News
  if (typeof d.newArticles === 'number') {
    lines.push(`${d.newArticles} nuevas · ${d.articlesFound ?? '?'} encontradas`)
  }
  if (d.queued) lines.push(`📬 Cola: ${d.queued}`)
  if ((d.imageErrors as unknown[])?.length) {
    lines.push(`⚠️ ${(d.imageErrors as unknown[]).length} fotos con error`)
  }

  // Matches
  if (typeof d.count === 'number') lines.push(`${d.count} partidos sincronizados`)

  // Player stats
  if (typeof d.updated === 'number') lines.push(`${d.updated} jugadores actualizados`)
  // Backfill news images
  if (typeof d.optimized === 'number') lines.push(`${d.optimized} fotos optimizadas`)
  if (typeof d.recovered === 'number' && d.recovered > 0) lines.push(`${d.recovered} fotos recuperadas`)
  if (typeof d.pending === 'number' && d.pending > 0) lines.push(`${d.pending} pendientes`)
  // Legacy field name
  if (typeof d.optimizedNewImages === 'number' && d.optimizedNewImages > 0) {
    lines.push(`${d.optimizedNewImages} fotos optimizadas`)
  }
  // Squad photos
  if (typeof d.failed === 'number' && d.failed > 0) lines.push(`⚠️ ${d.failed} fallidas`)
  if (d.warning) lines.push(`⚠️ ${d.warning}`)

  // Duration
  if (log.duration_ms) lines.push(`${(log.duration_ms / 1000).toFixed(1)}s`)

  return { lines: lines.length > 0 ? lines : ['OK'], ok: true }
}

export type SyncState = {
  status: Status
  phase: string
  result: { lines: string[]; ok: boolean } | null
  elapsed: number
}
export const IDLE: SyncState = { status: 'idle', phase: '', result: null, elapsed: 0 }

export function SyncCard({
  emoji, label, description, state,
  onClick,
}: {
  emoji: string
  label: string
  description: string
  state: SyncState
  onClick: () => void
}) {
  const busy = state.status === 'running'
  const done = state.status === 'ok' || state.status === 'error'
  const isError = state.status === 'error'

  return (
    <div className={`rounded-[14px] border-2 transition-colors ${
      isError ? 'border-ceuta-red bg-red-50' :
      state.status === 'ok' ? 'border-green-500 bg-green-50' :
      busy ? 'border-ceuta-black bg-white' :
      'border-ceuta-border bg-white'
    }`}>
      <button type="button"
        onClick={onClick}
        disabled={busy}
        className="w-full text-left p-4 disabled:cursor-not-allowed"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[22px] leading-none">{busy ? '⏳' : emoji}</span>
            <div>
              <div className={`text-[14px] font-bold ${
                isError ? 'text-ceuta-red' :
                state.status === 'ok' ? 'text-green-700' :
                'text-ceuta-black'
              }`}>{label}</div>
              <div className="text-[11px] text-ceuta-muted mt-0.5">{description}</div>
            </div>
          </div>
          {!busy && !done && (
            <div className="shrink-0 bg-ceuta-black text-white text-[11px] font-bold px-3 py-1.5 rounded-full">
              Ejecutar
            </div>
          )}
          {busy && (
            <div className="shrink-0 text-[10px] font-bold text-ceuta-muted tabular-nums">
              {state.elapsed}s
            </div>
          )}
        </div>
      </button>

      {/* Progress */}
      {busy && (
        <div className="px-4 pb-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-ceuta-black animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-[11px] text-ceuta-black font-medium">{state.phase}</span>
          </div>
          <div className="w-full h-0.5 bg-ceuta-border rounded-full overflow-hidden">
            <div className="h-full bg-ceuta-black rounded-full animate-pulse w-[60%]" />
          </div>
        </div>
      )}

      {/* Result */}
      {done && state.result && (
        <div className="px-4 pb-4 space-y-1">
          {state.result.lines.map((line, i) => (
            <div key={i} className={`text-[12px] font-medium ${isError ? 'text-ceuta-red' : 'text-green-700'}`}>
              {i === 0 && (isError ? '✗ ' : '✓ ')}{line}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Shared "did the component unmount?" guard so a delayed setTimeout from
 * triggerSync/sendPush/registerDevice doesn't call setState after unmount. */
export function useMountedRef() {
  const mountedRef = useRef(true)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])
  return mountedRef
}

export type SetSyncState = React.Dispatch<React.SetStateAction<SyncState>>
