import webpush from 'web-push'
import { getAllSubscriptions, deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'

export async function notifyAdmin(title: string, body: string): Promise<{ sent: number; total: number }> {
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT ?? 'mailto:angelhpascual@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const adminSubs = await getAllSubscriptions({ adminOnly: true })
  if (adminSubs.length === 0) return { sent: 0, total: 0 }

  const payload = JSON.stringify({
    title,
    body,
    tag: 'admin-queue',
    url: '/admin',
    icon: '/icon-512.png',
  })

  const results = await Promise.allSettled(
    adminSubs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      } catch (err: unknown) {
        // Stale/expired subscription (browser unsubscribed, PWA removed, etc.)
        // — clean it up so it doesn't keep failing silently forever.
        const status = (err as Record<string, unknown>)?.statusCode
        if (status === 410 || status === 404) await deleteSubscription(sub.endpoint)
        throw err
      }
    })
  )

  return {
    sent: results.filter((r) => r.status === 'fulfilled').length,
    total: adminSubs.length,
  }
}
