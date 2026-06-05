import { redirect } from 'next/navigation'
import { supabase } from '@/infrastructure/supabase/client'
import { CURRENT_SEASON } from '@/lib/constants'

function parseDevice(ua: string | null): { os: string; browser: string; icon: string } {
  if (!ua) return { os: 'Desconocido', browser: '—', icon: '❓' }
  const u = ua.toLowerCase()
  const isIOS     = /iphone|ipad/.test(u)
  const isAndroid = /android/.test(u)
  const isMac     = /macintosh/.test(u) && !isIOS
  const isWindows = /windows/.test(u)
  const isSafari  = /safari/.test(u) && !/chrome/.test(u)
  const isChrome  = /chrome/.test(u) && !/edg/.test(u)
  const isFirefox = /firefox/.test(u)
  const isEdge    = /edg/.test(u)

  const os     = isIOS ? 'iOS' : isAndroid ? 'Android' : isMac ? 'Mac' : isWindows ? 'Windows' : 'Otro'
  const browser = isSafari ? 'Safari' : isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isEdge ? 'Edge' : '—'
  const icon    = isIOS ? '🍎' : isAndroid ? '🤖' : isMac ? '💻' : isWindows ? '🖥️' : '❓'

  return { os, browser, icon }
}

async function getStats() {
  const [
    { count: subscribers },
    { count: totalNews },
    { count: players },
    { data: newsBySource },
    { data: cronLogs },
    { data: notifLogs },
    { data: subsGrowth },
    { data: subsList },
  ] = await Promise.all([
    supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }),
    supabase.from('news').select('*', { count: 'exact', head: true }),
    supabase.from('player_stats').select('*', { count: 'exact', head: true }).eq('season', CURRENT_SEASON),
    supabase.from('news').select('source').then(({ data }) => ({
      data: data
        ? Object.entries(
            data.reduce((acc: Record<string, number>, r) => { acc[r.source] = (acc[r.source] ?? 0) + 1; return acc }, {})
          ).sort((a, b) => b[1] - a[1])
        : [],
    })),
    supabase.from('cron_logs').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('notification_logs').select('*').order('created_at', { ascending: false }).limit(30),
    supabase.from('cron_logs').select('created_at, details').eq('cron_type', 'news').eq('status', 'success').order('created_at', { ascending: true }).limit(60),
    supabase.from('push_subscriptions').select('endpoint, user_agent, created_at').order('created_at', { ascending: false }),
  ])

  return {
    subscribers: subscribers ?? 0,
    totalNews: totalNews ?? 0,
    players: players ?? 0,
    newsBySource: (newsBySource as [string, number][]) ?? [],
    cronLogs: cronLogs ?? [],
    notifLogs: notifLogs ?? [],
    subsList: (subsList ?? []).map((s: { endpoint: string; user_agent: string | null; created_at: string | null }) => ({
      endpoint: s.endpoint,
      device: parseDevice(s.user_agent),
      createdAt: s.created_at,
    })),
    subsGrowth: (subsGrowth ?? []).map((r: { created_at: string; details: { subscribers?: number } }) => ({
      date: r.created_at,
      subs: r.details?.subscribers ?? 0,
    })),
  }
}

const SOURCE_LABELS: Record<string, string> = {
  oficial: 'AD Ceuta FC', faro: 'El Faro', elpueblo: 'El Pueblo',
  marca: 'Marca', mundodeportivo: 'Mundo Dep.', '20minutos': '20 Min.', elmundo: 'El Mundo',
}

const CRON_LABELS: Record<string, string> = {
  news: '📰 Noticias', 'player-stats': '📊 Stats', matches: '⚽ Partidos', live: '🔴 Live',
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid',
  })
}

function fmtDuration(ms: number | null) {
  if (!ms) return '—'
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

// Simple SVG bar chart
function BarChart({ data, color = '#D62027' }: { data: { label: string; value: number }[]; color?: string }) {
  if (data.length === 0) return <p style={{ color: '#6E6E6E', fontSize: 12 }}>Sin datos aún</p>
  const max = Math.max(...data.map(d => d.value), 1)
  const W = 320, H = 80, barW = Math.floor((W - (data.length - 1) * 2) / data.length)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const h = Math.max(2, Math.round((d.value / max) * H))
        const x = i * (barW + 2)
        return (
          <g key={i}>
            <rect x={x} y={H - h} width={barW} height={h} fill={color} rx={2} opacity={0.85} />
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize={8} fill="#6E6E6E">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

// Simple SVG line chart
function LineChart({ data, color = '#D62027' }: { data: number[]; color?: string }) {
  if (data.length < 2) return <p style={{ color: '#6E6E6E', fontSize: 12 }}>Sin datos suficientes aún</p>
  const W = 320, H = 60
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - (v / max) * H
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * W} cy={H - (v / max) * H} r={3} fill={color} />
      ))}
    </svg>
  )
}

const s = {
  page:      { fontFamily: 'system-ui, sans-serif', maxWidth: 520, margin: '0 auto', padding: '24px 16px', background: '#fff', minHeight: '100vh' } as React.CSSProperties,
  eyebrow:   { fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#D62027', marginBottom: 4 },
  title:     { fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' as const, color: '#0A0A0A', marginBottom: 24 },
  grid2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 } as React.CSSProperties,
  tileRed:   { background: '#D62027', borderRadius: 14, padding: 16 },
  tileBlack: { background: '#0A0A0A', borderRadius: 14, padding: 16 },
  tileGray:  { background: '#F5F4F1', borderRadius: 14, padding: 16 },
  bigNum:    (color = '#fff') => ({ fontSize: 48, fontWeight: 900, color, lineHeight: 1 }),
  label:     (color = 'rgba(255,255,255,0.75)') => ({ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color, marginTop: 8 }),
  sectionTitle: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#6E6E6E', marginBottom: 12 },
  card:      { background: '#F5F4F1', borderRadius: 14, padding: 16, marginBottom: 12 },
  table:     { width: '100%', borderCollapse: 'collapse' as const, fontSize: 12 },
  th:        { textAlign: 'left' as const, fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#6E6E6E', paddingBottom: 8 },
  td:        { padding: '7px 0', borderTop: '1px solid #E4E1DA', color: '#0A0A0A', verticalAlign: 'top' as const },
  badge:     (ok: boolean) => ({ display: 'inline-block', padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: ok ? '#dcfce7' : '#fee2e2', color: ok ? '#166534' : '#991b1b' }),
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>
}) {
  const { secret } = await searchParams
  if (secret !== process.env.TEST_SECRET) redirect('/')

  const stats = await getStats()

  // Notifications total
  const totalSent = stats.notifLogs.reduce((a: number, n: { sent_ok: number }) => a + (n.sent_ok ?? 0), 0)
  const totalRecip = stats.notifLogs.reduce((a: number, n: { recipients: number }) => a + (n.recipients ?? 0), 0)
  const deliveryRate = totalRecip > 0 ? Math.round((totalSent / totalRecip) * 100) : 0

  // Last successful news cron
  const lastNewsRun = stats.cronLogs.find((l: { cron_type: string; status: string }) => l.cron_type === 'news' && l.status === 'success')

  // News by source for bar chart
  const sourceChartData = stats.newsBySource.slice(0, 7).map(([src, count]) => ({
    label: SOURCE_LABELS[src]?.split(' ')[0] ?? src,
    value: count,
  }))

  // Subscribers evolution from cron logs
  const subsData = stats.subsGrowth.map((r: { subs: number }) => r.subs).filter((v: number) => v > 0)

  // Device breakdown
  const deviceCount: Record<string, number> = {}
  for (const s of stats.subsList) {
    const key = `${s.device.icon} ${s.device.os}`
    deviceCount[key] = (deviceCount[key] ?? 0) + 1
  }

  // Cron errors
  const cronErrors = stats.cronLogs.filter((l: { status: string }) => l.status === 'error')

  // Cron success rate
  const cronSuccess = stats.cronLogs.filter((l: { status: string }) => l.status === 'success').length
  const cronRate = stats.cronLogs.length > 0 ? Math.round((cronSuccess / stats.cronLogs.length) * 100) : 100

  return (
    <div style={s.page}>
      <div style={s.eyebrow}>Panel de administración</div>
      <div style={s.title}>AD Ceuta FC Info</div>

      {/* KPIs principales */}
      <div style={s.grid2}>
        <div style={s.tileRed}>
          <div style={s.bigNum()}>{stats.subscribers}</div>
          <div style={s.label()}>Usuarios activos</div>
        </div>
        <div style={s.tileBlack}>
          <div style={s.bigNum()}>{stats.notifLogs.length}</div>
          <div style={s.label()}>Notificaciones enviadas</div>
        </div>
      </div>

      <div style={s.grid2}>
        <div style={s.tileGray}>
          <div style={s.bigNum('#0A0A0A')}>{stats.totalNews}</div>
          <div style={s.label('#6E6E6E')}>Noticias en BD</div>
        </div>
        <div style={s.tileGray}>
          <div style={s.bigNum('#0A0A0A')}>{deliveryRate}%</div>
          <div style={s.label('#6E6E6E')}>Tasa de entrega</div>
        </div>
      </div>

      <div style={s.grid2}>
        <div style={s.tileGray}>
          <div style={s.bigNum('#0A0A0A')}>{cronRate}%</div>
          <div style={s.label('#6E6E6E')}>Éxito de crons</div>
        </div>
        <div style={s.tileGray}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', lineHeight: 1.3 }}>
            {fmt(lastNewsRun?.created_at ?? null)}
          </div>
          <div style={s.label('#6E6E6E')}>Último scrape noticias</div>
        </div>
      </div>

      {/* Gráfico suscriptores */}
      <div style={s.card}>
        <div style={s.sectionTitle}>Evolución de suscriptores</div>
        <LineChart data={subsData} color="#D62027" />
        {subsData.length === 0 && <p style={{ fontSize: 11, color: '#6E6E6E', margin: 0 }}>Los datos se acumularán con cada ejecución del scraper de noticias.</p>}
      </div>

      {/* Errores de crons */}
      {cronErrors.length > 0 && (
        <div style={{ ...s.card, background: '#fee2e2', marginBottom: 12 }}>
          <div style={{ ...s.sectionTitle, color: '#991b1b' }}>⚠️ Errores recientes en crons</div>
          <table style={s.table}>
            <tbody>
              {cronErrors.slice(0, 5).map((l: { id: number; cron_type: string; details: { error?: string }; created_at: string }) => (
                <tr key={l.id}>
                  <td style={s.td}><strong>{CRON_LABELS[l.cron_type] ?? l.cron_type}</strong></td>
                  <td style={{ ...s.td, color: '#991b1b', fontSize: 11 }}>{l.details?.error ?? 'Error desconocido'}</td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap', color: '#6E6E6E', fontSize: 11 }}>{fmt(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Suscriptores */}
      <div style={s.card}>
        <div style={s.sectionTitle}>Suscriptores ({stats.subscribers})</div>
        {/* Device breakdown */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {Object.entries(deviceCount).map(([key, count]) => (
            <div key={key} style={{ background: '#E4E1DA', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>
              {key} · {count}
            </div>
          ))}
        </div>
        {stats.subsList.length === 0 ? (
          <p style={{ fontSize: 11, color: '#6E6E6E', margin: 0 }}>Los nuevos suscriptores mostrarán dispositivo y fecha.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Dispositivo</th>
                <th style={s.th}>Navegador</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Suscrito el</th>
              </tr>
            </thead>
            <tbody>
              {stats.subsList.map((sub: { endpoint: string; device: { icon: string; os: string; browser: string }; createdAt: string | null }, i: number) => (
                <tr key={i}>
                  <td style={s.td}>{sub.device.icon} {sub.device.os}</td>
                  <td style={s.td}>{sub.device.browser}</td>
                  <td style={{ ...s.td, textAlign: 'right', color: '#6E6E6E', fontSize: 11, whiteSpace: 'nowrap' }}>{fmt(sub.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Gráfico noticias por fuente */}
      <div style={s.card}>
        <div style={s.sectionTitle}>Noticias por fuente</div>
        <BarChart data={sourceChartData} color="#D62027" />
        <table style={{ ...s.table, marginTop: 12 }}>
          <tbody>
            {stats.newsBySource.map(([src, count]) => (
              <tr key={src}>
                <td style={s.td}>{SOURCE_LABELS[src] ?? src}</td>
                <td style={{ ...s.td, textAlign: 'right', fontWeight: 700 }}>{count}</td>
                <td style={{ ...s.td, textAlign: 'right', color: '#6E6E6E', paddingLeft: 8 }}>
                  {Math.round((count / stats.totalNews) * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Historial de notificaciones */}
      <div style={s.card}>
        <div style={s.sectionTitle}>Historial de notificaciones</div>
        {stats.notifLogs.length === 0 ? (
          <p style={{ fontSize: 11, color: '#6E6E6E', margin: 0 }}>Sin notificaciones registradas aún. Se registrarán en el próximo scrape.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Artículo</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Env.</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {stats.notifLogs.map((n: { id: number; article_source: string; article_title: string; sent_ok: number; recipients: number; created_at: string }) => (
                <tr key={n.id}>
                  <td style={s.td}>
                    <div style={{ fontSize: 10, color: '#D62027', fontWeight: 700, marginBottom: 2 }}>{SOURCE_LABELS[n.article_source] ?? n.article_source}</div>
                    <div style={{ fontSize: 12, lineHeight: 1.3 }}>{n.article_title}</div>
                  </td>
                  <td style={{ ...s.td, textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 700 }}>
                    {n.sent_ok}<span style={{ color: '#6E6E6E', fontWeight: 400 }}>/{n.recipients}</span>
                  </td>
                  <td style={{ ...s.td, textAlign: 'right', whiteSpace: 'nowrap', color: '#6E6E6E', fontSize: 11 }}>
                    {fmt(n.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Historial de crons */}
      <div style={s.card}>
        <div style={s.sectionTitle}>Historial de crons (últimas 50 ejecuciones)</div>
        {stats.cronLogs.length === 0 ? (
          <p style={{ fontSize: 11, color: '#6E6E6E', margin: 0 }}>Sin ejecuciones registradas aún. Se registrarán en el próximo cron.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Cron</th>
                <th style={s.th}>Estado</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Duración</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {stats.cronLogs.map((l: { id: number; cron_type: string; status: string; duration_ms: number; details: { newArticles?: number; updated?: number; error?: string }; created_at: string }) => (
                <tr key={l.id}>
                  <td style={s.td}>
                    <div style={{ fontWeight: 600 }}>{CRON_LABELS[l.cron_type] ?? l.cron_type}</div>
                    {l.details?.newArticles != null && (
                      <div style={{ fontSize: 10, color: '#6E6E6E' }}>{l.details.newArticles} nuevas</div>
                    )}
                    {l.details?.updated != null && (
                      <div style={{ fontSize: 10, color: '#6E6E6E' }}>{l.details.updated} jugadores</div>
                    )}
                    {l.details?.error && (
                      <div style={{ fontSize: 10, color: '#991b1b' }}>{l.details.error}</div>
                    )}
                  </td>
                  <td style={s.td}><span style={s.badge(l.status === 'success')}>{l.status === 'success' ? '✓ OK' : '✗ Error'}</span></td>
                  <td style={{ ...s.td, textAlign: 'right', color: '#6E6E6E' }}>{fmtDuration(l.duration_ms)}</td>
                  <td style={{ ...s.td, textAlign: 'right', color: '#6E6E6E', fontSize: 11 }}>{fmt(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
