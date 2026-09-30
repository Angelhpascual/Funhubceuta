import webpush from 'web-push'
import { getAllSubscriptions, deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'

export interface PushPayload {
  title: string
  body: string
  tag?: string
  url?: string
  icon?: string
}

async function sendPushToEnvironment(
  payload: PushPayload,
  environment: string,
  adminOnly = false
): Promise<{ sent: number; total: number }> {
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT ?? 'mailto:angelhpascual@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const subs = await getAllSubscriptions({ environment, adminOnly })
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

export async function sendPush(payload: PushPayload): Promise<{ sent: number; total: number }> {
  if (process.env.VERCEL_ENV !== 'production') return { sent: 0, total: 0 }
  return sendPushToEnvironment(payload, 'production')
}

export async function sendPushDev(payload: PushPayload): Promise<{ sent: number; total: number }> {
  return sendPushToEnvironment(payload, 'development')
}

// Admin-only test push — used for manual/simulated triggers (e.g. cron
// ?test=true&secret=...) that are already gated by a secret, so they're
// allowed to bypass the production-only restriction of sendPush() above.
// Only ever reaches admin-marked subscriptions, never real fans.
export async function sendPushAdminOnly(payload: PushPayload): Promise<{ sent: number; total: number }> {
  const environment = process.env.VERCEL_ENV === 'production' ? 'production' : 'development'
  return sendPushToEnvironment(payload, environment, true)
}
