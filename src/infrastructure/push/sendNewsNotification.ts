import webpush from 'web-push'
import { supabase } from '@/infrastructure/supabase/client'
import { ParsedArticle } from '@/infrastructure/rss/RssFetcher'

webpush.setVapidDetails(
  'mailto:angelhpascual@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const SOURCE_LABELS: Record<string, string> = {
  oficial:        'AD Ceuta FC',
  faro:           'El Faro de Ceuta',
  elpueblo:       'El Pueblo de Ceuta',
  marca:          'Marca',
  mundodeportivo: 'Mundo Deportivo',
  '20minutos':    '20 Minutos',
  elmundo:        'El Mundo',
}

export async function sendNewsNotification(article: ParsedArticle): Promise<void> {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')

  if (!subs || subs.length === 0) return

  const payload = JSON.stringify({
    title: SOURCE_LABELS[article.source] ?? 'AD Ceuta Info',
    body: article.title,
    tag: `news-${article.externalId}`,
    url: article.url,
    icon: '/icon-512.png',
  })

  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(async (err: { statusCode?: number }) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      })
    )
  )
}
