'use client'

import { useEffect, useState, useCallback } from 'react'

type LogEntry = {
  id: number
  created_at: string
  cron_type: string
  status: string
  duration_ms: number
  details: {
    newArticles?: number
    articlesFound?: number
    queued?: string | null
    imageErrors?: { title: string; url: string }[]
    noImageArticles?: number
    updated?: number
    error?: string
    summary?: { source?: string; new?: number; count?: number; error?: string }[]
  }
}

const CRON_META: Record<string, { label: string; icon: string }> = {
  news:              { label: 'Scraper noticias', icon: '📰' },
  'player-stats':    { label: 'Estadísticas jugadores', icon: '📊' },
  matches:           { label: 'Partidos', icon: '⚽' },
  live:              { label: 'Partido en vivo', icon: '🔴' },
  'match-day':       { label: 'Día de partido', icon: '🏟️' },
  'backfill-images': { label: 'Sync fotos', icon: '🖼️' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Ahora'
  if (m < 60) return `Hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)}d`
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Madrid',
  })
}

function fmtMs(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

export function ActivityTimeline() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const fetchLogs = useCallback(async () => {
    const res = await fetch('/api/admin/activity')
    if (!res.ok) return
    const data = await res.json()
    setLogs(data.logs ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 30000)
    return () => clearInterval(interval)
  }, [fetchLogs])

  if (loading) {
    return <div className="text-[11px] text-ceuta-muted uppercase tracking-widest px-1 py-4">Cargando actividad…</div>
  }

  if (logs.length === 0) {
    return <div className="text-[11px] text-ceuta-muted uppercase tracking-widest px-1 py-4">Sin actividad registrada</div>
  }

  const errors = logs.filter((l) => l.status !== 'success' || (l.details.imageErrors as unknown[])?.length)
  const lastLog = logs[0]

  return (
    <div>
      {/* Header colapsable */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <div className="flex items-center gap-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-ceuta-muted">Actividad reciente</p>
          {errors.length > 0 && (
            <span className="text-[9px] font-bold text-ceuta-red bg-red-50 px-1.5 py-0.5 rounded-full">
              {errors.length} error{errors.length > 1 ? 'es' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {collapsed && lastLog && (
            <span className="text-[10px] text-ceuta-muted">{timeAgo(lastLog.created_at)}</span>
          )}
          <span className="text-[10px] text-ceuta-muted group-hover:text-ceuta-black transition-colors">
            {collapsed ? '▼ Ver' : '▲ Ocultar'}
          </span>
        </div>
      </button>

      {collapsed && (
        <div className="flex gap-1 flex-wrap mb-1">
          {logs.slice(0, 6).map((log) => {
            const meta = CRON_META[log.cron_type] ?? { icon: '⚙️' }
            const ok = log.status === 'success'
            return (
              <div key={log.id} className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border ${ok ? 'border-ceuta-border text-ceuta-muted' : 'border-red-200 text-ceuta-red bg-red-50'}`}>
                <span>{meta.icon}</span>
                <span>{timeAgo(log.created_at)}</span>
              </div>
            )
          })}
        </div>
      )}

    {!collapsed && <div className="relative">
      <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-ceuta-border" />

      <div className="space-y-1">
        {logs.map((log) => {
          const meta = CRON_META[log.cron_type] ?? { label: log.cron_type, icon: '⚙️' }
          const ok = log.status === 'success'
          const hasErrors = !ok || (log.details.imageErrors?.length ?? 0) > 0 || !!log.details.error
          const isExpanded = expanded === log.id
          const hasNew = (log.details.newArticles ?? 0) > 0

          return (
            <div key={log.id} className="relative pl-10">
              <div className={`absolute left-[11px] top-[14px] w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center text-[8px]
                ${hasErrors ? 'bg-red-100 border-ceuta-red' : hasNew ? 'bg-green-100 border-green-600' : 'bg-white border-ceuta-border'}`}>
                {hasErrors ? '✗' : hasNew ? '✓' : '·'}
              </div>

              <button
                onClick={() => setExpanded(isExpanded ? null : log.id)}
                className="w-full text-left py-2.5 px-3 rounded-[10px] hover:bg-ceuta-bg-soft transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[14px]">{meta.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-ceuta-black truncate">{meta.label}</div>
                      <div className="text-[10px] text-ceuta-muted">
                        {timeAgo(log.created_at)} · {fmt(log.created_at)}
                        {log.duration_ms ? ` · ${fmtMs(log.duration_ms)}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasErrors && (
                      <span className="text-[10px] font-bold text-ceuta-red bg-red-50 px-2 py-0.5 rounded-full">Error</span>
                    )}
                    {hasNew && (
                      <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        +{log.details.newArticles}
                      </span>
                    )}
                    <span className="text-[10px] text-ceuta-muted">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-ceuta-border space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    {log.details.articlesFound != null && (
                      <div className="text-[11px] text-ceuta-muted">
                        {log.details.articlesFound} artículos encontrados · {log.details.newArticles ?? 0} nuevos
                      </div>
                    )}
                    {log.details.queued && (
                      <div className="text-[11px] text-ceuta-black bg-ceuta-bg-mid rounded-lg px-2 py-1">
                        📬 Cola: <span className="font-semibold">{log.details.queued}</span>
                      </div>
                    )}
                    {(log.details.imageErrors?.length ?? 0) > 0 && (
                      <div className="bg-red-50 rounded-lg px-2 py-1.5 space-y-1">
                        <div className="text-[10px] font-bold text-ceuta-red uppercase tracking-wider">
                          ⚠️ {log.details.imageErrors!.length} imágenes fallidas
                        </div>
                        {log.details.imageErrors!.map((e, i) => (
                          <div key={i} className="text-[10px] text-ceuta-black truncate">· {e.title}</div>
                        ))}
                      </div>
                    )}
                    {(log.details.noImageArticles ?? 0) > 0 && (
                      <div className="text-[11px] text-yellow-700 bg-yellow-50 rounded-lg px-2 py-1">
                        ⚠️ {log.details.noImageArticles} artículos sin imagen
                      </div>
                    )}
                    {log.details.error && (
                      <div className="text-[11px] text-ceuta-red bg-red-50 rounded-lg px-2 py-1">
                        ✗ {log.details.error}
                      </div>
                    )}
                    {log.details.summary && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {log.details.summary
                          .filter((s) => (s.new ?? 0) > 0 || s.error)
                          .map((s, i) => (
                            <span key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {s.source} {s.error ? '✗' : `+${s.new}`}
                            </span>
                          ))}
                      </div>
                    )}
                    {log.details.updated != null && (
                      <div className="text-[11px] text-ceuta-muted">{log.details.updated} jugadores actualizados</div>
                    )}
                  </div>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>}
    </div>
  )
}
