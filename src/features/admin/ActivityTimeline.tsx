'use client'

import { useEffect, useState, useCallback } from 'react'
import { timeAgo, fmtDate, fmtDuration } from '@/lib/formatters'

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

const CRON_META: Record<string, { label: string }> = {
  news:              { label: 'Scraper noticias' },
  'player-stats':    { label: 'Estadísticas' },
  matches:           { label: 'Partidos' },
  live:              { label: 'En vivo' },
  'match-day':       { label: 'Día de partido' },
  'backfill-images': { label: 'Sync fotos' },
}

function dotColor(log: LogEntry) {
  const hasError = log.status !== 'success' || !!log.details.error || (log.details.imageErrors?.length ?? 0) > 0
  if (hasError) return 'bg-ceuta-red'
  if ((log.details.newArticles ?? 0) > 0) return 'bg-[#1E9E4B]'
  return 'bg-ceuta-border'
}

export function ActivityTimeline() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

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

  if (loading) return (
    <div className="font-display text-[11px] text-ceuta-muted uppercase tracking-widest py-4">Cargando actividad…</div>
  )

  if (logs.length === 0) return (
    <div className="font-display text-[11px] text-ceuta-muted uppercase tracking-widest py-4">Sin actividad registrada</div>
  )

  const errorCount = logs.filter(l => l.status !== 'success' || !!l.details.error || (l.details.imageErrors?.length ?? 0) > 0).length

  return (
    <div>
      {/* Summary strip */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1">
          {logs.slice(0, 8).map(l => (
            <div key={l.id} className={`w-2 h-2 rounded-full ${dotColor(l)}`} title={CRON_META[l.cron_type]?.label ?? l.cron_type} />
          ))}
        </div>
        {errorCount > 0 && (
          <span className="font-display text-[10px] font-bold tracking-[0.1em] uppercase text-ceuta-red bg-red-50 px-2 py-0.5 rounded-full">
            {errorCount} error{errorCount > 1 ? 'es' : ''}
          </span>
        )}
        <span className="font-display text-[10px] text-ceuta-muted ml-auto">{logs.length} entradas</span>
      </div>

      {/* Feed */}
      <div className="relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-ceuta-border" />

        <div className="space-y-0.5">
          {logs.map((log) => {
            const meta = CRON_META[log.cron_type] ?? { label: log.cron_type }
            const hasError = log.status !== 'success' || !!log.details.error || (log.details.imageErrors?.length ?? 0) > 0
            const hasNew = (log.details.newArticles ?? 0) > 0
            const isExpanded = expanded === log.id
            const dot = dotColor(log)

            return (
              <div key={log.id} className="relative pl-6">
                {/* Dot */}
                <div className={`absolute left-[3px] top-[13px] w-[9px] h-[9px] rounded-full border-2 border-white ${dot}`} />

                <button
                  onClick={() => setExpanded(isExpanded ? null : log.id)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-ceuta-bg-soft transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-display text-[12px] font-bold ${hasError ? 'text-ceuta-red' : 'text-ceuta-black'}`}>
                          {meta.label}
                        </span>
                        {hasNew && (
                          <span className="font-display text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#E7F6EC] text-[#1E9E4B]">
                            +{log.details.newArticles} nuevas
                          </span>
                        )}
                        {hasError && !hasNew && (
                          <span className="font-display text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-ceuta-red">
                            Error
                          </span>
                        )}
                      </div>
                      <div className="font-display text-[10px] text-ceuta-muted mt-0.5">
                        {timeAgo(log.created_at)} · {fmtDate(log.created_at)}
                        {log.duration_ms ? ` · ${fmtDuration(log.duration_ms)}` : ''}
                      </div>
                    </div>
                    <span className="text-[10px] text-ceuta-muted shrink-0">{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-ceuta-border space-y-1.5" onClick={e => e.stopPropagation()}>
                      {log.details.articlesFound != null && (
                        <div className="font-body text-[11px] text-ceuta-muted">
                          {log.details.articlesFound} encontrados · {log.details.newArticles ?? 0} nuevos
                        </div>
                      )}
                      {log.details.queued && (
                        <div className="font-body text-[11px] text-ceuta-black bg-ceuta-bg-mid rounded-lg px-2 py-1">
                          Cola: <span className="font-semibold">{log.details.queued}</span>
                        </div>
                      )}
                      {(log.details.imageErrors?.length ?? 0) > 0 && (
                        <div className="bg-red-50 rounded-lg px-2 py-1.5 space-y-1">
                          <div className="font-display text-[10px] font-bold text-ceuta-red uppercase tracking-wider">
                            {log.details.imageErrors!.length} imágenes fallidas
                          </div>
                          {log.details.imageErrors!.map((e, i) => (
                            <div key={i} className="font-body text-[10px] text-ceuta-black truncate">· {e.title}</div>
                          ))}
                        </div>
                      )}
                      {(log.details.noImageArticles ?? 0) > 0 && (
                        <div className="font-body text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1">
                          {log.details.noImageArticles} artículos sin imagen
                        </div>
                      )}
                      {log.details.error && (
                        <div className="font-body text-[11px] text-ceuta-red bg-red-50 rounded-lg px-2 py-1">
                          ✗ {log.details.error}
                        </div>
                      )}
                      {log.details.summary && (
                        <div className="flex flex-wrap gap-1">
                          {log.details.summary
                            .filter(s => (s.new ?? 0) > 0 || s.error)
                            .map((s, i) => (
                              <span key={i} className={`font-display text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.error ? 'bg-red-100 text-ceuta-red' : 'bg-[#E7F6EC] text-[#1E9E4B]'}`}>
                                {s.source} {s.error ? '✗' : `+${s.new}`}
                              </span>
                            ))}
                        </div>
                      )}
                      {log.details.updated != null && (
                        <div className="font-body text-[11px] text-ceuta-muted">{log.details.updated} jugadores actualizados</div>
                      )}
                    </div>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
