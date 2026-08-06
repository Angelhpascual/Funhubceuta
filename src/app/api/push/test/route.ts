import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'

// GET /api/push/test?secret=xxx
// Sends a test notification to every subscription and returns per-device results.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  webpush.setVapidDetails(
    'mailto:angelhpascual@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth, user_agent, created_at')

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, message: 'No subscriptions', results: [] })
  }

  const payload = JSON.stringify({
    title: '🧪 Test — AD Ceuta FC',
    body: `Notificación de prueba · ${new Date().toLocaleTimeString('es-ES')}`,
    tag: 'test-push',
    url: '/',
    icon: '/icon-512.png',
  })

  const results = await Promise.all(
    subs.map(async (sub) => {
      const browser =
        sub.endpoint.includes('fcm.googleapis') ? 'Chrome/FCM' :
        sub.endpoint.includes('web.push.apple') ? 'Safari/APNs' :
        sub.endpoint.includes('push.services.mozilla') ? 'Firefox' : 'Unknown'

      const ua = (sub.user_agent ?? '').slice(0, 80)

      try {
        const res = await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        return {
          id: sub.id,
          browser,
          ua,
          created_at: sub.created_at,
          status: 'ok',
          statusCode: res.statusCode,
          endpoint: sub.endpoint.slice(0, 60) + '...',
        }
      } catch (err: unknown) {
        const e = err as { statusCode?: number; body?: string; message?: string }

        // Auto-remove dead subscriptions
        if (e.statusCode === 410 || e.statusCode === 404) {
          await deleteSubscription(sub.endpoint)
        }

        return {
          id: sub.id,
          browser,
          ua,
          created_at: sub.created_at,
          status: 'error',
          statusCode: e.statusCode,
          error: e.body ?? e.message ?? String(err),
          endpoint: sub.endpoint.slice(0, 60) + '...',
          removed: e.statusCode === 410 || e.statusCode === 404,
        }
      }
    })
  )

  const ok = results.filter((r) => r.status === 'ok').length
  const errors = results.filter((r) => r.status === 'error').length

  return NextResponse.json({ ok: true, sent: ok, failed: errors, total: subs.length, results })
}
