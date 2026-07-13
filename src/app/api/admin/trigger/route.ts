import { NextResponse } from 'next/server'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'

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

const ACTIONS: Record<string, () => Promise<Record<string, unknown>>> = {
  news: async () => enqueueViaQStash('/api/cron/news'),
  matches: async () => enqueueViaQStash('/api/cron/matches'),
  'match-day': async () => enqueueViaQStash('/api/cron/match-day'),
  'backfill-images': async () => enqueueViaQStash('/api/cron/backfill-images'),
}

export async function POST(request: Request) {
  if (!(await checkAdminAuth())) {
    return unauthorizedResponse()
  }

  const body = await request.json()
  const { action, payload } = body as {
    action: string
    payload?: { title: string; body: string; tag: string; url: string }
  }

  // Custom push notification — production subscribers
  if (action === 'push' && payload) {
    const { sendPush } = await import('@/infrastructure/push/sendPush')
    const result = await sendPush(payload)
    return NextResponse.json({ ok: true, ...result })
  }

  // Custom push notification — develop/test subscribers only
  if (action === 'push-dev' && payload) {
    const { sendPushDev } = await import('@/infrastructure/push/sendPush')
    const result = await sendPushDev(payload)
    return NextResponse.json({ ok: true, ...result })
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

  const result = await handler()
  return NextResponse.json({ ok: true, action, result })
}
