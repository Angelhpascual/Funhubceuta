import webpush from 'web-push'
import { SOURCE_LABELS } from '@/lib/constants'
import { ParsedArticle } from '@/infrastructure/rss/RssFetcher'
import { decodeEntities } from '@/lib/decodeEntities'
import {
  getAllSubscriptions,
  deleteSubscription,
} from '@/infrastructure/supabase/PushSubscriptionsRepository'


export async function sendNewsNotification(
  article: ParsedArticle
): Promise<{ recipients: number; sentOk: number; sentFail: number }> {
  webpush.setVapidDetails(
    'mailto:angelhpascual@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const subs = await getAllSubscriptions()
  if (subs.length === 0) return { recipients: 0, sentOk: 0, sentFail: 0 }

  const sourceLabel = SOURCE_LABELS[article.source] ?? 'Noticias'
  const payload = JSON.stringify({
    title: '🔴 Noticias',
    body: `${sourceLabel} · ${decodeEntities(article.title)}`,
    tag: `news-${article.externalId}`,
    url: '/',
    icon: '/icon-512.png',
  })

  let sentOk = 0
  let sentFail = 0

  await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        .then(() => {
          sentOk++
        })
        .catch(async (err: { statusCode?: number }) => {
          sentFail++
          if (err.statusCode === 410 || err.statusCode === 404) {
            await deleteSubscription(sub.endpoint)
          }
        })
    )
  )

  return { recipients: subs.length, sentOk, sentFail }
}
