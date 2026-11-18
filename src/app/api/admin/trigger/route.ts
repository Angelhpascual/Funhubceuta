import { NextResponse } from 'next/server'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { getAppEnv } from '@/lib/appEnv'

export const maxDuration = 60

// Enqueue via QStash so Vercel timeout doesn't cut the response
async function enqueueViaQStash(path: string): Promise<{ queued: boolean }> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://adceutainfo.vercel.app'
  const token = process.env.QSTASH_TOKEN
  if (!token) return { queued: false }

  const res = await fetch(`https://qstash.upstash.io/v2/publish/${base}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })
  return { queued: res.ok }
}

// Call a cron endpoint directly (bypasses QStash signature requirement)
async function callDirect(path: string): Promise<Record<string, unknown>> {
  const base = getAppEnv() === 'production'
    ? (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://adceutainfo.vercel.app')
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000')
  const secret = process.env.TEST_SECRET
  if (!secret) throw new Error('TEST_SECRET no configurado')

  const res = await fetch(`${base}${path}?secret=${secret}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Error ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// One-time setup: creates the QStash schedule for a new cron if it doesn't
// already exist (idempotent via a stored config key), so a new recurring
// cron can be wired up from the admin panel without needing direct access
// to QSTASH_TOKEN outside the deployed app.
async function ensureSchedule(configKey: string, path: string, cron: string): Promise<Record<string, unknown>> {
  const { getConfig, setConfig } = await import('@/infrastructure/supabase/AppConfigRepository')
  const existing = await getConfig(configKey)
  if (existing) return { already: true, scheduleId: existing }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://adceutainfo.vercel.app'
  const { Client } = await import('@upstash/qstash')
  const client = new Client({ token: process.env.QSTASH_TOKEN! })
  const schedule = await client.schedules.create({ destination: `${base}${path}`, cron })
  await setConfig(configKey, schedule.scheduleId)
  return { created: true, scheduleId: schedule.scheduleId }
}

const ACTIONS: Record<string, () => Promise<Record<string, unknown>>> = {
  news: async () => enqueueViaQStash('/api/cron/news'),
  matches: async () => enqueueViaQStash('/api/cron/matches'),
  'match-day': async () => enqueueViaQStash('/api/cron/match-day'),
  // Image backfills run directly — QStash signature fails on preview URLs
  'backfill-news-images': async () => callDirect('/api/cron/backfill-images'),
  'backfill-squad-photos': async () => callDirect('/api/cron/backfill-squad-photos'),
  'backfill-transfer-photos': async () => callDirect('/api/cron/backfill-transfer-photos'),
  // Stats sync — run directly so the admin gets an immediate result
  standings: async () => callDirect('/api/standings/sync'),
  squad: async () => callDirect('/api/cron/squad'),
  'player-stats': async () => callDirect('/api/cron/player-stats'),
  'close-finished-matches': async () => callDirect('/api/cron/close-finished-matches'),
  'setup-close-finished-matches-schedule': async () =>
    ensureSchedule('close_finished_matches_qstash_schedule_id', '/api/cron/close-finished-matches', '*/20 * * * *'),
  // squad had no QStash schedule at all — it only ever ran from this admin
  // panel's manual "sync now" button, so the roster (and its photo backfill)
  // silently went two months stale between manual triggers with nothing in
  // cron_logs to flag it as missing, unlike every other data source.
  'setup-squad-schedule': async () =>
    ensureSchedule('squad_qstash_schedule_id', '/api/cron/squad', '0 8 * * 2'),
}

export async function POST(request: Request) {
  if (!(await checkAdminAuth())) {
    return unauthorizedResponse()
  }

  const body = await request.json()
  const { action, payload } = body as {
    action: string
    payload?: { title: string; body: string; tag: string; url: string } & { team?: 'ceuta' | 'rival' }
  }

  // Gol anulado — ESPN no reporta este evento en el feed (ni keyEvents ni
  // commentary), así que no hay forma de detectarlo automáticamente desde el
  // cron de live. Disparo manual del admin en el momento, con el mismo
  // catálogo de mensajes que usa el resto del live.
  if (action === 'goal-disallowed') {
    const { MSG } = await import('@/app/api/cron/live/messages')
    const { sendPush } = await import('@/infrastructure/push/sendPush')
    const team = payload?.team === 'rival' ? 'rival' : 'ceuta'
    const msg = MSG.goalDisallowed(team)
    const result = await sendPush({ title: msg.title, body: msg.body, tag: 'goal-disallowed', url: '/live' })
    return NextResponse.json({ ok: true, action, team, result })
  }

  // Custom push notification — production subscribers
  if (action === 'push' && payload) {
    const { sendPush } = await import('@/infrastructure/push/sendPush')
    const result = await sendPush(payload)
    return NextResponse.json({ ok: true, action, result })
  }

  // Custom push notification — develop/test subscribers only
  if (action === 'push-dev' && payload) {
    const { sendPushDev } = await import('@/infrastructure/push/sendPush')
    const result = await sendPushDev(payload)
    return NextResponse.json({ ok: true, action, result })
  }

  // Simulate admin queue alert
  if (action === 'test-admin-alert') {
    const { supabaseAdmin } = await import('@/infrastructure/supabase/adminClient')
    const { count } = await supabaseAdmin
      .from('news')
      .select('*', { count: 'exact', head: true })
      .eq('notify_queued', true)
      .then((r) => ({ count: r.count ?? 0 }))
    const { notifyAdmin } = await import('@/infrastructure/push/notifyAdmin')
    await notifyAdmin(
      '📬 Noticias pendientes',
      `${count} noticia${count !== 1 ? 's' : ''} esperando tu aprobación`
    )
    return NextResponse.json({ ok: true, queued: count })
  }

  const handler = ACTIONS[action]
  if (!handler) {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }

  try {
    const result = await handler()
    return NextResponse.json({ ok: true, action, result })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
