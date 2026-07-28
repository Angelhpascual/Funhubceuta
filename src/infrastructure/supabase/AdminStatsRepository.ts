import { supabase } from './client'
import { supabaseAdmin } from './adminClient'
import { getActiveMvpSession } from './MvpRepository'
import type { AdminStats } from '@/features/admin/AdminDashboard'

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

export async function getAdminStats(): Promise<AdminStats> {
  const [
    { count: subscribers },
    { count: totalNews },
    { data: newsRuns },
    { data: notifLogs },
    { data: matchRun },
    newsBySourceRaw,
    { data: subsList },
    mvpSession,
  ] = await Promise.all([
    supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }),
    supabase.from('news').select('*', { count: 'exact', head: true }),
    supabase.from('cron_logs').select('id, created_at, status, duration_ms, details, cron_type').order('created_at', { ascending: false }).limit(50),
    supabase.from('notification_logs').select('id, created_at, article_title, article_source, recipients, sent_ok, sent_fail').order('created_at', { ascending: false }).limit(30),
    supabase.from('cron_logs').select('created_at, status').eq('cron_type', 'matches').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('news').select('source').then(({ data }) => ({
      data: data ? Object.entries(
        data.reduce((acc: Record<string, number>, r) => { acc[r.source] = (acc[r.source] ?? 0) + 1; return acc }, {})
      ).sort((a, b) => b[1] - a[1]) : [],
    })),
    supabase.from('push_subscriptions').select('endpoint, user_agent, created_at').order('created_at', { ascending: false }),
    getActiveMvpSession(),
  ])

  const runs = newsRuns ?? []
  const notifs = notifLogs ?? []
  const totalSent = notifs.reduce((a: number, n: { sent_ok: number }) => a + (n.sent_ok ?? 0), 0)
  const totalRecip = notifs.reduce((a: number, n: { recipients: number }) => a + (n.recipients ?? 0), 0)
  const deliveryRate = totalRecip > 0 ? Math.round((totalSent / totalRecip) * 100) : null

  const newsRuns10 = runs.filter((r: { cron_type?: string }) => r.cron_type === 'news').slice(0, 10)

  const subsHistory = newsRuns10
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
    lastNewsRun: newsRuns10[0] ?? null,
    lastMatchRun: matchRun ?? null,
    newsRuns: newsRuns10,
    notifLogs: notifs,
    newsBySource: (newsBySourceRaw.data as [string, number][]) ?? [],
    subsHistory,
    subsList: parsedSubs,
    deviceCount,
    mvpSession: mvpSession ? { status: mvpSession.status, match_label: mvpSession.match_label } : null,
  }
}

export async function getRecentCronLogs(limit = 30) {
  const { data } = await supabaseAdmin
    .from('cron_logs')
    .select('id, created_at, cron_type, status, duration_ms, details')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}
