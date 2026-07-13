import webpush from 'web-push'
import { getAllSubscriptions, deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'

export interface PushPayload {
  title: string
  body: string
  tag?: string
  url?: string
  icon?: string
}

export async function sendPush(payload: PushPayload): Promise<{ sent: number; total: number }> {
  webpush.setVapidDetails(
    'mailto:angelhpascual@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  if (process.env.VERCEL_ENV !== 'production') return { sent: 0, total: 0 }

  const subs = await getAllSubscriptions()
  if (subs.length === 0) return { sent: 0, total: 0 }

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ icon: '/icon-512.png', url: '/', ...payload })
        )
        .catch(async (err: { statusCode?: number }) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await deleteSubscription(sub.endpoint)
          }
          throw err
        })
    )
  )

  return {
    sent: results.filter((r) => r.status === 'fulfilled').length,
    total: subs.length,
  }
}
