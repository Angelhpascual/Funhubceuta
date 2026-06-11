import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { supabase } from '@/infrastructure/supabase/client'

webpush.setVapidDetails(
  'mailto:angelhpascual@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  tag?: string
  url?: string
}

export async function POST(request: Request) {
  const payload: PushPayload = await request.json()

  const { data: subs } = await supabase.from('push_subscriptions').select('endpoint, p256dh, auth')

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
        .catch(async (err) => {
          // Remove expired/invalid subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          }
          throw err
        })
    )
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return NextResponse.json({ ok: true, sent, total: subs.length })
}
