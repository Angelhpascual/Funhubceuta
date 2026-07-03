'use client'

import { useState } from 'react'
import { AdminActions } from './AdminActions'
import { NotifQueue } from './NotifQueue'
import { ActivityTimeline } from './ActivityTimeline'

const SOURCE_LABELS: Record<string, string> = {
  oficial: 'AD Ceuta FC', faro: 'El Faro', elpueblo: 'El Pueblo',
  ceutadeportiva: 'Ceuta Dep.', marca: 'Marca', mundodeportivo: 'Mundo Dep.',
  '20minutos': '20 Min.', elmundo: 'El Mundo', as: 'AS', sport: 'Sport',
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Madrid',
  })
}

function timeAgo(iso: string | null) {
  if (!iso) return 'Nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `Hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)}d`
}

function fmtDuration(ms: number | null) {
  if (!ms) return ''
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

type RunLog = {
  id: number; created_at: string; status: string; duration_ms: number; cron_type?: string
  details: { articlesFound?: number; newArticles?: number; queued?: string | null; subscribers?: number; summary?: { source?: string; new?: number; count?: number; error?: string }[]; updated?: number; error?: string }
}
type NotifLog = { id: number; created_at: string; article_title: string; article_source: string; recipients: number; sent_ok: number; sent_fail: number }
type Sub = { endpoint: string; device: { icon: string; os: string; browser: string }; createdAt: string | null }

export type AdminStats = {
  subscribers: number
  totalNews: number
  deliveryRate: number | null
  lastNewsRun: RunLog | null
  lastMatchRun: { created_at: string; status: string } | null
  newsRuns: RunLog[]
  notifLogs: NotifLog[]
  newsBySource: [string, number][]
  subsHistory: { date: string; count: number }[]
  subsList: Sub[]
  deviceCount: Record<string, number>
}

const TABS = [
  { id: 'acciones', label: 'Acciones' },
  { id: 'noticias', label: 'Scraper' },
  { id: 'notifs', label: 'Notifs' },
  { id: 'subs', label: 'Suscriptores' },
] as const
type Tab = (typeof TABS)[number]['id']

export function AdminDashboard({ stats }: { stats: AdminStats }) {
  const [tab, setTab] = useState<Tab>('acciones')

  const newsOk = stats.lastNewsRun?.status === 'success'
  const matchOk = stats.lastMatchRun?.status === 'success'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ceuta-red">Admin</p>
          <h1 className="text-[22px] font-black uppercase tracking-tight text-ceuta-black leading-none">AD Ceuta FC</h1>
        </div>
        <div className="flex gap-2 items-center">
          <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${newsOk ? 'bg-green-50 text-green-700' : 'bg-red-50 text-ceuta-red'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${newsOk ? 'bg-green-500' : 'bg-ceuta-red'}`} />
            📰 {timeAgo(stats.lastNewsRun?.created_at ?? null)}
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${matchOk ? 'bg-green-50 text-green-700' : 'bg-red-50 text-ceuta-red'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${matchOk ? 'bg-green-500' : 'bg-ceuta-red'}`} />
            ⚽ {timeAgo(stats.lastMatchRun?.created_at ?? null)}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-ceuta-red rounded-[14px] p-3">
          <div className="text-[32px] font-black text-white leading-none">{stats.subscribers}</div>
          <div className="text-[8px] font-bold uppercase tracking-widest text-white/70 mt-1">Suscriptores</div>
        </div>
        <div className="bg-ceuta-black rounded-[14px] p-3">
          <div className="text-[32px] font-black text-white leading-none">{stats.totalNews}</div>
          <div className="text-[8px] font-bold uppercase tracking-widest text-white/70 mt-1">Noticias</div>
        </div>
        <div className="bg-ceuta-bg-soft rounded-[14px] p-3">
          <div className="text-[32px] font-black text-ceuta-black leading-none">
            {stats.deliveryRate !== null ? `${stats.deliveryRate}%` : '—'}
          </div>
          <div className="text-[8px] font-bold uppercase tracking-widest text-ceuta-muted mt-1">Entrega</div>
        </div>
      </div>

      {/* Cola de notificaciones */}
      <NotifQueue />

      {/* Timeline de actividad */}
      <ActivityTimeline />

      {/* Tabs */}
      <div className="chips">
        {TABS.map((t) => (
          <button key={t.id} className={`chip ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Acciones */}
      {tab === 'acciones' && <AdminActions />}

      {/* Tab: Scraper noticias */}
      {tab === 'noticias' && (
        <div className="space-y-3">
          {/* Último run por fuente */}
          {stats.lastNewsRun?.details?.summary && (
            <div className="bg-ceuta-bg-soft rounded-[14px] p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted mb-3">Último run — fuentes</p>
              <div className="space-y-2">
                {(stats.lastNewsRun.details.summary as { source?: string; new?: number; count?: number; error?: string }[]).map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[12px] text-ceuta-black">{SOURCE_LABELS[s.source ?? ''] ?? s.source}</span>
                    {s.error
                      ? <span className="text-[11px] text-ceuta-red">✗ Error</span>
                      : <div className="flex items-center gap-3">
                          <span className="text-[11px] text-ceuta-muted">{s.count ?? 0}</span>
                          <span className={`text-[11px] font-bold ${(s.new ?? 0) > 0 ? 'text-green-700' : 'text-ceuta-muted'}`}>+{s.new ?? 0}</span>
                        </div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historial 10 runs */}
          <div className="bg-ceuta-bg-soft rounded-[14px] p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted mb-3">Últimas 10 ejecuciones</p>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[9px] font-bold uppercase tracking-wide text-ceuta-muted pb-2">Fecha</th>
                  <th className="text-right text-[9px] font-bold uppercase tracking-wide text-ceuta-muted pb-2">Total</th>
                  <th className="text-right text-[9px] font-bold uppercase tracking-wide text-ceuta-muted pb-2">Nuevas</th>
                  <th className="text-right text-[9px] font-bold uppercase tracking-wide text-ceuta-muted pb-2">Dur.</th>
                </tr>
              </thead>
              <tbody>
                {stats.newsRuns.map((run: RunLog) => (
                  <tr key={run.id} className="border-t border-ceuta-border">
                    <td className="py-2 text-[11px] text-ceuta-muted whitespace-nowrap">{fmt(run.created_at)}</td>
                    <td className="py-2 text-[12px] text-right text-ceuta-black font-bold">
                      {run.status === 'success' ? run.details?.articlesFound ?? '—' : <span className="text-ceuta-red">✗</span>}
                    </td>
                    <td className="py-2 text-[12px] text-right">
                      {run.status === 'success'
                        ? <span className={(run.details?.newArticles ?? 0) > 0 ? 'text-green-700 font-bold' : 'text-ceuta-muted'}>{run.details?.newArticles ?? 0}</span>
                        : '—'}
                    </td>
                    <td className="py-2 text-[11px] text-right text-ceuta-muted">{fmtDuration(run.duration_ms)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Noticias por fuente */}
          <div className="bg-ceuta-bg-soft rounded-[14px] p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted mb-3">BD por fuente</p>
            <div className="space-y-2">
              {stats.newsBySource.map(([src, count]) => {
                const pct = stats.totalNews > 0 ? (count / stats.totalNews) * 100 : 0
                return (
                  <div key={src} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[11px] text-ceuta-black truncate">{SOURCE_LABELS[src] ?? src}</span>
                        <span className="text-[11px] font-bold text-ceuta-black ml-2">{count}</span>
                      </div>
                      <div className="h-1 bg-ceuta-border rounded-full overflow-hidden">
                        <div className="h-full bg-ceuta-red rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Notificaciones */}
      {tab === 'notifs' && (
        <div className="bg-ceuta-bg-soft rounded-[14px] p-4 space-y-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted mb-1">Historial de notificaciones</p>
          {stats.notifLogs.length === 0
            ? <p className="text-[12px] text-ceuta-muted">Sin notificaciones aún</p>
            : stats.notifLogs.map((n: NotifLog) => {
                const rate = n.recipients > 0 ? Math.round((n.sent_ok / n.recipients) * 100) : 0
                const rateColor = rate >= 90 ? 'text-green-700' : rate >= 70 ? 'text-yellow-600' : 'text-ceuta-red'
                return (
                  <div key={n.id} className="border-b border-ceuta-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-bold text-ceuta-red mb-0.5 uppercase tracking-wide">{SOURCE_LABELS[n.article_source] ?? n.article_source}</div>
                        <div className="text-[12px] font-semibold text-ceuta-black leading-tight line-clamp-2">{n.article_title}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-[16px] font-black ${rateColor}`}>{rate}%</div>
                        <div className="text-[9px] text-ceuta-muted">{n.sent_ok}/{n.recipients}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-ceuta-muted mt-1">{fmt(n.created_at)}</div>
                  </div>
                )
              })}
        </div>
      )}

      {/* Tab: Suscriptores */}
      {tab === 'subs' && (
        <div className="space-y-3">
          {/* Dispositivos */}
          <div className="bg-ceuta-bg-soft rounded-[14px] p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted mb-3">Por dispositivo</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(stats.deviceCount).map(([key, count]) => (
                <div key={key} className="bg-white rounded-full px-3 py-1.5 text-[12px] font-bold text-ceuta-black border border-ceuta-border">
                  {key} · {count}
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico evolución */}
          {stats.subsHistory.length >= 2 && (
            <div className="bg-ceuta-bg-soft rounded-[14px] p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted mb-3">Evolución</p>
              <div className="flex items-end gap-1 h-12">
                {stats.subsHistory.map((p, i) => {
                  const max = Math.max(...stats.subsHistory.map((s) => s.count))
                  const pct = max > 0 ? (p.count / max) * 100 : 0
                  return (
                    <div key={i} className="flex-1">
                      <div className="w-full bg-ceuta-red rounded-sm" style={{ height: `${Math.max(pct, 4)}%` }} />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-ceuta-muted">{stats.subsHistory[0]?.count}</span>
                <span className="text-[9px] text-ceuta-muted">{stats.subsHistory[stats.subsHistory.length - 1]?.count}</span>
              </div>
            </div>
          )}

          {/* Lista */}
          <div className="bg-ceuta-bg-soft rounded-[14px] p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted mb-3">Lista ({stats.subscribers})</p>
            <div className="space-y-2">
              {stats.subsList.map((sub, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-ceuta-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">{sub.device.icon}</span>
                    <div>
                      <div className="text-[12px] font-semibold text-ceuta-black">{sub.device.os}</div>
                      <div className="text-[10px] text-ceuta-muted">{sub.device.browser}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-ceuta-muted">{fmt(sub.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
