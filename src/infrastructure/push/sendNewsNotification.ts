import webpush from 'web-push'
import { ParsedArticle } from '@/infrastructure/rss/RssFetcher'
import { decodeEntities } from '@/lib/decodeEntities'
import {
  getAllSubscriptions,
  deleteSubscription,
} from '@/infrastructure/supabase/PushSubscriptionsRepository'

const SOURCE_LABELS: Record<string, string> = {
  oficial: 'AD Ceuta FC',
  faro: 'El Faro de Ceuta',
  elpueblo: 'El Pueblo de Ceuta',
  marca: 'Marca',
  mundodeportivo: 'Mundo Deportivo',
  '20minutos': '20 Minutos',
  sport: 'Sport',
  as: 'AS',
  confidencial: 'El Confidencial',
  abc: 'ABC',
  lavanguardia: 'La Vanguardia',
  cope: 'COPE',
  ser: 'Cadena SER',
  ceutatv: 'Ceuta Televisión',
  rtvc: 'RTV Ceuta',
  laverdad: 'La Verdad de Ceuta',
  ceutaactualidad: 'Ceuta Actualidad',
  onefootball: 'OneFootball',
  ceutaaldia: 'Ceuta al Día',
  elpais: 'El País',
  rtve: 'RTVE',
  goal: 'Goal.com',
  elgoldigital: 'El Gol Digital',
  fondosegunda: 'Fondo Segunda',
  transfermarkt: 'Transfermarkt',
}

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
    url: article.url,
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
