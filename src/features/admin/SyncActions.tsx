'use client'

import { useState, useRef } from 'react'
import {
  callTrigger, useCronPoller, buildResult, SyncCard, useMountedRef,
  IDLE, type SyncState, type SetSyncState,
} from './adminActionsShared'

export function SyncActions() {
  const poll = useCronPoller()
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useMountedRef()

  const [syncNews, setSyncNews] = useState<SyncState>(IDLE)
  const [syncNewsImages, setSyncNewsImages] = useState<SyncState>(IDLE)
  const [syncMatches, setSyncMatches] = useState<SyncState>(IDLE)
  const [syncStandings, setSyncStandings] = useState<SyncState>(IDLE)
  const [syncSquad, setSyncSquad] = useState<SyncState>(IDLE)
  const [syncPlayerStats, setSyncPlayerStats] = useState<SyncState>(IDLE)

  function startElapsed(set: SetSyncState) {
    if (elapsedRef.current) clearInterval(elapsedRef.current)
    let t = 0
    elapsedRef.current = setInterval(() => {
      t += 1
      set((prev) => ({ ...prev, elapsed: t }))
    }, 1000)
  }

  function stopElapsed() {
    if (elapsedRef.current) clearInterval(elapsedRef.current)
  }

  async function triggerSync(
    set: SetSyncState,
    action: string,
    cronType: string,
    phases: string[],
    opts: { direct?: boolean } = {}
  ) {
    set({ status: 'running', phase: phases[0], result: null, elapsed: 0 })
    startElapsed(set)
    const since = Date.now()

    // Phase cycling while waiting
    let phaseIdx = 0
    const phaseInterval = setInterval(() => {
      phaseIdx = Math.min(phaseIdx + 1, phases.length - 1)
      set((prev) => ({ ...prev, phase: phases[phaseIdx] }))
    }, 4000)

    let directResult: Record<string, unknown> | undefined
    try {
      directResult = await callTrigger(action)
    } catch (e) {
      clearInterval(phaseInterval)
      stopElapsed()
      set({ status: 'error', phase: '', result: { lines: [(e as Error).message], ok: false }, elapsed: 0 })
      setTimeout(() => { if (mountedRef.current) set(IDLE) }, 8000)
      return
    }

    // For direct actions the job already ran — use the response directly
    if (opts.direct && directResult) {
      clearInterval(phaseInterval)
      stopElapsed()
      const lines: string[] = []
      const raw = directResult as Record<string, unknown>
      const d = (raw.result ?? raw) as Record<string, unknown>
      if (typeof d.optimized === 'number') lines.push(`${d.optimized} fotos optimizadas`)
      if (typeof d.recovered === 'number' && d.recovered > 0) lines.push(`${d.recovered} fotos recuperadas`)
      if (typeof d.pending === 'number' && d.pending > 0) lines.push(`${d.pending} pendientes`)
      if (typeof d.failed === 'number' && d.failed > 0) lines.push(`⚠️ ${d.failed} fallidas`)
      if (typeof d.teams === 'number') lines.push(`${d.teams} equipos actualizados`)
      if (typeof d.count === 'object' && d.count && 'matches' in (d.count as Record<string, unknown>)) {
        lines.push(`${(d.count as Record<string, unknown>).matches} partidos sincronizados`)
      } else if (typeof d.count === 'number') {
        lines.push(`${d.count} jugadores sincronizados`)
      }
      if (typeof d.updated === 'number') lines.push(`${d.updated} jugadores actualizados`)
      if (Array.isArray(d.errors) && d.errors.length > 0) {
        d.errors.slice(0, 3).forEach((e: unknown) => lines.push(`· ${String(e).slice(0, 70)}`))
      }
      if (lines.length === 0) lines.push('OK')
      const hasError = typeof d.failed === 'number' && d.failed > 0
      set({ status: hasError ? 'error' : 'ok', phase: '', result: { lines, ok: !hasError }, elapsed: 0 })
      setTimeout(() => { if (mountedRef.current) set(IDLE) }, 15000)
      return
    }

    poll(
      cronType,
      since,
      (log) => {
        clearInterval(phaseInterval)
        stopElapsed()
        const result = buildResult(log)
        set({ status: result.ok ? 'ok' : 'error', phase: '', result, elapsed: 0 })
        setTimeout(() => { if (mountedRef.current) set(IDLE) }, 10000)
      },
      () => {
        clearInterval(phaseInterval)
        stopElapsed()
        set({ status: 'error', phase: '', result: { lines: ['Sin respuesta del servidor'], ok: false }, elapsed: 0 })
        setTimeout(() => { if (mountedRef.current) set(IDLE) }, 8000)
      }
    )
  }

  return (
    <section>
      <div className="space-y-2">
        <SyncCard
          emoji="📰"
          label="Noticias"
          description="Scraper RSS + imágenes. Encola para notificación."
          state={syncNews}
          onClick={() => triggerSync(setSyncNews, 'news', 'news', [
            'Lanzando scraper…',
            'Procesando fuentes RSS…',
            'Descargando imágenes…',
            'Finalizando…',
          ])}
        />
        <SyncCard
          emoji="🖼️"
          label="Optimizar fotos noticias"
          description="Migra y convierte a WebP las imágenes externas de noticias."
          state={syncNewsImages}
          onClick={() => triggerSync(setSyncNewsImages, 'backfill-news-images', 'backfill-images', [
            'Buscando fotos externas en noticias…',
            'Descargando y convirtiendo a WebP…',
            'Actualizando base de datos…',
          ], { direct: true })}
        />
        <SyncCard
          emoji="🗓️"
          label="Partidos y resultados"
          description="Próximos partidos, últimos resultados y racha (últimos 5)."
          state={syncMatches}
          onClick={() => triggerSync(setSyncMatches, 'matches', 'matches', [
            'Consultando calendario…',
            'Actualizando resultados…',
            'Recalculando racha…',
          ])}
        />
        <SyncCard
          emoji="📊"
          label="Clasificación"
          description="Actualiza la tabla de LaLiga Hypermotion desde ESPN."
          state={syncStandings}
          onClick={() => triggerSync(setSyncStandings, 'standings', 'standings', [
            'Consultando ESPN…',
            'Actualizando clasificación…',
          ], { direct: true })}
        />
        <SyncCard
          emoji="👕"
          label="Plantilla"
          description="Re-scrapea la plantilla oficial (LaLiga) para la temporada actual."
          state={syncSquad}
          onClick={() => triggerSync(setSyncSquad, 'squad', 'squad', [
            'Abriendo plantilla oficial…',
            'Leyendo jugadores…',
            'Actualizando base de datos…',
          ], { direct: true })}
        />
        <SyncCard
          emoji="⚽"
          label="Stats de jugadores"
          description="Goles, asistencias, tarjetas y paradas desde ESPN."
          state={syncPlayerStats}
          onClick={() => triggerSync(setSyncPlayerStats, 'player-stats', 'player-stats', [
            'Consultando ESPN…',
            'Actualizando rankings…',
          ], { direct: true })}
        />
      </div>
    </section>
  )
}
