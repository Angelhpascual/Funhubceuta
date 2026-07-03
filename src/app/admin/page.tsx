import { supabase } from '@/infrastructure/supabase/client'
import { AdminActions } from '@/features/admin/AdminActions'
import { NotifQueue } from '@/features/admin/NotifQueue'
import { ActivityTimeline } from '@/features/admin/ActivityTimeline'

function parseDevice(ua: string | null): { os: string; browser: string; icon: string } {
  if (!ua) return { os: 'Desconocido', browser: '—', icon: '❓' }
  const u = ua.toLowerCase()
  const isIOS = /iphone|ipad/.test(u)
  const isAndroid = /android/.test(u)
  const isMac = /macintosh/.test(u) && !isIOS
  const isWindows = /windows/.test(u)
  const isSafari = /safari/.test(u) && !/chrome/.test(u)
  const isChrome = /chrome/.test(u) && !/edg/.test(u)
  const isFirefox = /firefox/.test(u)
  const isEdge = /edg/.test(u)
  const os = isIOS ? 'iOS' : isAndroid ? 'Android' : isMac ? 'Mac' : isWindows ? 'Windows' : 'Otro'
  const browser = isSafari ? 'Safari' : isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isEdge ? 'Edge' : '—'
  const icon = isIOS ? '🍎' : isAndroid ? '🤖' : isMac ? '💻' : isWindows ? '🖥️' : '❓'
  return { os, browser, icon }
}

async function getStats() {
  const [
    { count: subscribers },
    { count: totalNews },
    { data: newsRuns },
    { data: notifLogs },
    { data: allCronLogs },
    { data: matchRun },
    { data: newsBySource },
    { data: subsList },
  ] = await Promise.all([
    supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }),
    supabase.from('news').select('*', { count: 'exact', head: true }),
    supabase.from('cron_logs').select('id, created_at, status, duration_ms, details').eq('cron_type', 'news').order('created_at', { ascending: false }).limit(10),
    supabase.from('notification_logs').select('id, created_at, article_title, article_source, recipients, sent_ok, sent_fail').order('created_at', { ascending: false }).limit(30),
    supabase.from('cron_logs').select('id, created_at, status, duration_ms, cron_type, details').order('created_at', { ascending: false }).limit(50),
    supabase.from('cron_logs').select('created_at, status').eq('cron_type', 'matches').order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('news').select('source').then(({ data }) => ({
      data: data ? Object.entries(
        data.reduce((acc: Record<string, number>, r) => { acc[r.source] = (acc[r.source] ?? 0) + 1; return acc }, {})
      ).sort((a, b) => b[1] - a[1]) : [],
    })),
    supabase.from('push_subscriptions').select('endpoint, user_agent, created_at').order('created_at', { ascending: false }),
  ])

  const runs = newsRuns ?? []
  const lastNewsRun = runs[0] ?? null
  const notifs = notifLogs ?? []
  const totalSent = notifs.reduce((a: number, n: { sent_ok: number }) => a + (n.sent_ok ?? 0), 0)
  const totalRecip = notifs.reduce((a: number, n: { recipients: number }) => a + (n.recipients ?? 0), 0)
  const deliveryRate = totalRecip > 0 ? Math.round((totalSent / totalRecip) * 100) : null

  const subsHistory = runs
    .filter((r: { details: { subscribers?: number } }) => r.details?.subscribers != null)
    .map((r: { created_at: string; details: { subscribers: number } }) => ({ date: r.created_at, count: r.details.subscribers }))
    .reverse()

  const parsedSubs = (subsList ?? []).map((s: { endpoint: string; user_agent: string | null; created_at: string | null }) => ({
    endpoint: s.endpoint,
    device: parseDevice(s.user_agent),
    createdAt: s.created_at,
  }))

  const deviceCount: Record<string, number> = {}
  for (const s of parsedSubs) {
    const key = `${s.device.icon} ${s.device.os}`
    deviceCount[key] = (deviceCount[key] ?? 0) + 1
  }

  return {
    subscribers: subscribers ?? 0,
    totalNews: totalNews ?? 0,
    deliveryRate,
    lastNewsRun,
    lastMatchRun: matchRun ?? null,
    newsRuns: runs,
    notifLogs: notifs,
    allCronLogs: allCronLogs ?? [],
    newsBySource: (newsBySource as [string, number][]) ?? [],
    subsHistory,
    subsList: parsedSubs,
    deviceCount,
  }
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

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid',
  })
}

function fmtDuration(ms: number | null) {
  if (!ms) return '—'
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

const SOURCE_LABELS: Record<string, string> = {
  oficial: 'AD Ceuta FC', faro: 'El Faro', elpueblo: 'El Pueblo',
  ceutadeportiva: 'Ceuta Dep.', marca: 'Marca', mundodeportivo: 'Mundo Dep.',
  '20minutos': '20 Min.', elmundo: 'El Mundo', as: 'AS', sport: 'Sport',
}

const CRON_LABELS: Record<string, string> = {
  news: '📰 Noticias', 'player-stats': '📊 Stats', matches: '⚽ Partidos', live: '🔴 Live',
}

type RunLog = {
  id: number; created_at: string; status: string; duration_ms: number; cron_type?: string
  details: { articlesFound?: number; newArticles?: number; notified?: string | null; subscribers?: number; summary?: { source?: string; new?: number; count?: number; error?: string }[]; updated?: number; error?: string }
}
type NotifLog = { id: number; created_at: string; article_title: string; article_source: string; recipients: number; sent_ok: number; sent_fail: number }

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-ceuta-bg-soft rounded-[14px] p-4">
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-ceuta-muted mb-3">{title}</p>
      {children}
    </div>
  )
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`${right ? 'text-right' : 'text-left'} text-[9px] font-bold uppercase tracking-[0.08em] text-ceuta-muted pb-2`}>{children}</th>
}

function Td({ children, right, muted, nowrap, bold }: { children: React.ReactNode; right?: boolean; muted?: boolean; nowrap?: boolean; bold?: boolean }) {
  return (
    <td className={[
      'py-2',
      right ? 'text-right' : '',
      muted ? 'text-ceuta-muted' : 'text-ceuta-black',
      nowrap ? 'whitespace-nowrap' : '',
      bold ? 'font-bold' : '',
      'text-[12px]',
    ].join(' ')}>{children}</td>
  )
}

export default async function AdminPage() {
  const stats = await getStats()

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ceuta-red mb-1">Panel de administración</p>
        <h1 className="text-[26px] font-black uppercase tracking-tight text-ceuta-black">AD Ceuta FC</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-ceuta-red rounded-[14px] p-4">
          <div className="text-4xl font-black text-white leading-none">{stats.subscribers}</div>
          <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/70 mt-2">Suscriptores</div>
        </div>
        <div className="bg-ceuta-black rounded-[14px] p-4">
          <div className="text-4xl font-black text-white leading-none">{stats.totalNews}</div>
          <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/70 mt-2">Noticias</div>
        </div>
        <div className="bg-ceuta-bg-soft rounded-[14px] p-4">
          <div className="text-4xl font-black text-ceuta-black leading-none">
            {stats.deliveryRate !== null ? `${stats.deliveryRate}%` : '—'}
          </div>
          <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-ceuta-muted mt-2">Entrega</div>
        </div>
      </div>

      {/* Estado del sistema */}
      <Card title="Estado del sistema">
        {[
          { label: '📰 Scraper noticias', log: stats.lastNewsRun },
          { label: '⚽ Scraper partidos', log: stats.lastMatchRun },
        ].map(({ label, log }) => {
          const ok = log?.status === 'success'
          return (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-ceuta-border last:border-0">
              <span className="text-[13px] font-semibold text-ceuta-black">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-ceuta-muted">{timeAgo(log?.created_at ?? null)}</span>
                <span className={`w-2 h-2 rounded-full ${log ? (ok ? 'bg-green-500' : 'bg-ceuta-red') : 'bg-ceuta-border'}`} />
              </div>
            </div>
          )
        })}
      </Card>

      {/* Cola de notificaciones pendientes */}
      <NotifQueue />

      {/* Línea de tiempo de actividad */}
      <ActivityTimeline />

      {/* Acciones */}
      <AdminActions />

      {/* Últimas 10 ejecuciones scraper noticias */}
      <Card title="Últimas ejecuciones — scraper noticias">
        {stats.newsRuns.length === 0 ? <p className="text-[12px] text-ceuta-muted">Sin datos aún</p> : (
          <table className="w-full border-collapse">
            <thead><tr>
              <Th>Fecha</Th>
              <Th right>Encontradas</Th>
              <Th right>Nuevas</Th>
              <Th>Notificó</Th>
            </tr></thead>
            <tbody>
              {stats.newsRuns.map((run: RunLog) => {
                const ok = run.status === 'success'
                return (
                  <tr key={run.id} className="border-t border-ceuta-border">
                    <Td muted nowrap>{fmt(run.created_at)}</Td>
                    <Td right bold>{ok ? (run.details?.articlesFound ?? '—') : <span className="text-ceuta-red">✗</span>}</Td>
                    <Td right>
                      {ok ? <span className={(run.details?.newArticles ?? 0) > 0 ? 'text-green-700 font-bold' : 'text-ceuta-muted'}>{run.details?.newArticles ?? 0}</span> : '—'}
                    </Td>
                    <Td muted>
                      {run.details?.notified
                        ? <span className="text-ceuta-black text-[11px] line-clamp-1">{run.details.notified}</span>
                        : <span className="opacity-30">—</span>}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Desglose por fuente — último run */}
      {stats.lastNewsRun?.details?.summary && (
        <Card title="Último run — desglose por fuente">
          <div className="space-y-2">
            {(stats.lastNewsRun.details.summary as { source?: string; new?: number; count?: number; error?: string }[]).map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[12px] text-ceuta-black">{SOURCE_LABELS[s.source ?? ''] ?? s.source}</span>
                {s.error ? <span className="text-[11px] text-ceuta-red">✗ Error</span> : (
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-ceuta-muted">{s.count ?? 0} encontradas</span>
                    <span className={`text-[11px] font-bold ${(s.new ?? 0) > 0 ? 'text-green-700' : 'text-ceuta-muted'}`}>{s.new ?? 0} nuevas</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Noticias por fuente */}
      <Card title="Noticias en BD por fuente">
        <table className="w-full border-collapse">
          <tbody>
            {stats.newsBySource.map(([src, count]) => {
              const pct = stats.totalNews > 0 ? Math.round((count / stats.totalNews) * 100) : 0
              return (
                <tr key={src} className="border-t border-ceuta-border">
                  <Td>{SOURCE_LABELS[src] ?? src}</Td>
                  <Td right bold>{count}</Td>
                  <Td right muted>{pct}%</Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {/* Historial notificaciones */}
      <Card title="Historial de notificaciones">
        {stats.notifLogs.length === 0 ? <p className="text-[12px] text-ceuta-muted">Sin notificaciones registradas aún</p> : (
          <div className="space-y-3">
            {stats.notifLogs.map((n: NotifLog) => {
              const rate = n.recipients > 0 ? Math.round((n.sent_ok / n.recipients) * 100) : 0
              const rateColor = rate >= 90 ? 'text-green-700' : rate >= 70 ? 'text-yellow-600' : 'text-ceuta-red'
              return (
                <div key={n.id} className="border-b border-ceuta-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-ceuta-red mb-0.5 uppercase tracking-wide">{SOURCE_LABELS[n.article_source] ?? n.article_source}</div>
                      <div className="text-[12px] font-semibold text-ceuta-black leading-tight line-clamp-2">{n.article_title}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-[13px] font-black ${rateColor}`}>{rate}%</div>
                      <div className="text-[9px] text-ceuta-muted">{n.sent_ok}/{n.recipients}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-ceuta-muted mt-1">{fmt(n.created_at)}</div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Suscriptores por dispositivo */}
      <Card title={`Suscriptores (${stats.subscribers})`}>
        <div className="flex gap-2 flex-wrap mb-4">
          {Object.entries(stats.deviceCount).map(([key, count]) => (
            <div key={key} className="bg-ceuta-bg-mid rounded-full px-3 py-1 text-[11px] font-bold text-ceuta-black">
              {key} · {count}
            </div>
          ))}
        </div>
        {stats.subsList.length > 0 && (
          <table className="w-full border-collapse">
            <thead><tr>
              <Th>Dispositivo</Th>
              <Th>Navegador</Th>
              <Th right>Suscrito</Th>
            </tr></thead>
            <tbody>
              {stats.subsList.map((sub: { endpoint: string; device: { icon: string; os: string; browser: string }; createdAt: string | null }, i: number) => (
                <tr key={i} className="border-t border-ceuta-border">
                  <Td>{sub.device.icon} {sub.device.os}</Td>
                  <Td muted>{sub.device.browser}</Td>
                  <Td right muted nowrap>{fmt(sub.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Evolución suscriptores */}
      {stats.subsHistory.length >= 2 && (
        <Card title="Evolución de suscriptores">
          <div className="flex items-end gap-1 h-16">
            {stats.subsHistory.map((p: { date: string; count: number }, i: number) => {
              const max = Math.max(...stats.subsHistory.map((s: { count: number }) => s.count))
              const pct = max > 0 ? (p.count / max) * 100 : 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-ceuta-red rounded-sm" style={{ height: `${Math.max(pct, 4)}%` }} />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-ceuta-muted">{stats.subsHistory[0]?.count ?? 0}</span>
            <span className="text-[9px] text-ceuta-muted">{stats.subsHistory[stats.subsHistory.length - 1]?.count ?? 0}</span>
          </div>
        </Card>
      )}

      {/* Historial de crons */}
      <Card title="Historial de crons (últimas 50 ejecuciones)">
        {stats.allCronLogs.length === 0 ? <p className="text-[12px] text-ceuta-muted">Sin ejecuciones aún</p> : (
          <table className="w-full border-collapse">
            <thead><tr>
              <Th>Cron</Th>
              <Th>Estado</Th>
              <Th right>Dur.</Th>
              <Th right>Fecha</Th>
            </tr></thead>
            <tbody>
              {stats.allCronLogs.map((l: RunLog) => (
                <tr key={l.id} className="border-t border-ceuta-border">
                  <td className="py-1.5">
                    <div className="text-[12px] font-semibold text-ceuta-black">{CRON_LABELS[l.cron_type ?? ''] ?? l.cron_type}</div>
                    {l.details?.newArticles != null && <div className="text-[10px] text-ceuta-muted">{l.details.newArticles} nuevas</div>}
                    {l.details?.updated != null && <div className="text-[10px] text-ceuta-muted">{l.details.updated} jugadores</div>}
                    {l.details?.error && <div className="text-[10px] text-ceuta-red">{l.details.error}</div>}
                  </td>
                  <td className="py-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${l.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {l.status === 'success' ? '✓ OK' : '✗ Error'}
                    </span>
                  </td>
                  <Td right muted nowrap>{fmtDuration(l.duration_ms)}</Td>
                  <Td right muted nowrap>{fmt(l.created_at)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
