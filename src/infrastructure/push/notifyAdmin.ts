import webpush from 'web-push'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'

export async function notifyAdmin(title: string, body: string) {
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT ?? 'mailto:angelhpascual@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const { data: adminSubs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('is_admin', true)

  if (!adminSubs || adminSubs.length === 0) return

  const payload = JSON.stringify({
    title,
    body,
    tag: 'admin-queue',
    url: '/admin',
    icon: '/icon-512.png',
  })

  await Promise.allSettled(
    adminSubs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )
}
