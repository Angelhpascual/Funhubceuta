import { SOURCE_LABELS } from '@/lib/constants'
import { ParsedArticle } from '@/infrastructure/rss/RssFetcher'
import { decodeEntities } from '@/lib/decodeEntities'
import { sendPush } from './sendPush'

export async function sendNewsNotification(
  article: ParsedArticle
): Promise<{ recipients: number; sentOk: number; sentFail: number }> {
  const sourceLabel = SOURCE_LABELS[article.source] ?? 'Noticias'

  const { sent, total } = await sendPush({
    title: '🔴 Noticias',
    body: `${sourceLabel} · ${decodeEntities(article.title)}`,
    tag: `news-${article.externalId}`,
    url: '/',
  })

  return { recipients: total, sentOk: sent, sentFail: total - sent }
}
