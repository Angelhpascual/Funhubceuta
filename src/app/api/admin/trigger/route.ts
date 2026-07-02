import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'

function deriveToken(password: string): string {
  return createHash('sha256').update(password + 'funhub-admin-v1').digest('hex')
}

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')?.value
  const password = process.env.ADMIN_PASSWORD
  if (!session || !password) return false
  return session === deriveToken(password)
}

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

const TEAMS_26_27 = [
  { id: '2737', name: 'Albacete' }, { id: '6832', name: 'Almería' },
  { id: '12597', name: 'Burgos' }, { id: '11487', name: 'CD Sabadell' },
  { id: '4438', name: 'Castellón' }, { id: '5404', name: 'Ceuta' },
  { id: '3842', name: 'Cádiz' }, { id: '8447', name: 'Córdoba' },
  { id: '3752', name: 'Eibar' }, { id: '7320', name: 'Eldense' },
  { id: '20179', name: 'FC Andorra' }, { id: '9812', name: 'Girona' },
  { id: '3747', name: 'Granada' }, { id: '98', name: 'Las Palmas' },
  { id: '17534', name: 'Leganés' }, { id: '84', name: 'Mallorca' },
  { id: '85', name: 'RC Celta Fortuna' }, { id: '92', name: 'Real Oviedo' },
  { id: '20983', name: 'Real Sociedad II' }, { id: '95', name: 'Real Valladolid' },
  { id: '3788', name: 'Sporting Gijón' }, { id: '245', name: 'Tenerife' },
]

const ACTIONS: Record<string, () => Promise<Record<string, unknown>>> = {
  news: async () => enqueueViaQStash('/api/cron/news'),
  matches: async () => enqueueViaQStash('/api/cron/matches'),
  'match-day': async () => enqueueViaQStash('/api/cron/match-day'),
  'backfill-images': async () => enqueueViaQStash('/api/cron/backfill-images'),
  'sync-logos': async () => {
    const { supabase } = await import('@/infrastructure/supabase/client')
    const rows = TEAMS_26_27.map(({ id, name }) => ({
      name,
      logo_url: `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`,
      season: '2026-2027',
    }))
    const { error } = await supabase.from('teams').upsert(rows, { onConflict: 'name,season', ignoreDuplicates: false })
    return { ok: !error, total: rows.length, error: error?.message ?? null }
  },
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { action, payload } = body as {
    action: string
    payload?: { title: string; body: string; tag: string; url: string }
  }

  // Custom push notification — call internally to avoid cross-origin issues
  if (action === 'push' && payload) {
    const { sendPush } = await import('@/infrastructure/push/sendPush')
    const result = await sendPush(payload)
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
