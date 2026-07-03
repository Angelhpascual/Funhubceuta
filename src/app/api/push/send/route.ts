import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { getAllSubscriptions, deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'

export interface PushPayload {
  title: string
  body: string
  tag?: string
  url?: string
}

export async function POST(request: Request) {
  webpush.setVapidDetails(
    'mailto:angelhpascual@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const payload: PushPayload = await request.json()
  const subs = await getAllSubscriptions()

  if (subs.length === 0) {
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
          if (err.statusCode === 410 || err.statusCode === 404) {
            await deleteSubscription(sub.endpoint)
          }
          throw err
        })
    )
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return NextResponse.json({ ok: true, sent, total: subs.length })
}
