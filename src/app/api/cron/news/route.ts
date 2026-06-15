import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { RSS_SOURCES } from '@/infrastructure/rss/sources'
import { fetchSource, ParsedArticle } from '@/infrastructure/rss/RssFetcher'
import { fetchAdceutaOfficialNews } from '@/infrastructure/rss/adceutaFetcher'
import { fetchGoogleNews } from '@/infrastructure/rss/googleNewsFetcher'
import { fetchOgImage } from '@/infrastructure/rss/fetchOgImage'
import { NewsSupabaseRepository } from '@/infrastructure/supabase/NewsSupabaseRepository'
import { sendNewsNotification } from '@/infrastructure/push/sendNewsNotification'
import { logCron, logNotification } from '@/infrastructure/supabase/logCron'
import { supabase } from '@/infrastructure/supabase/client'

const repo = new NewsSupabaseRepository()

// Source priority for picking the most relevant new article to notify about
const SOURCE_PRIORITY: Record<string, number> = {
  oficial: 0,
  faro: 1,
  elpueblo: 2,
  marca: 3,
  mundodeportivo: 4,
  '20minutos': 5,
  sport: 6,
  as: 7,
  confidencial: 8,
  abc: 9,
  lavanguardia: 10,
  cope: 11,
  ser: 12,
  onefootball: 13,
  ceutatv: 14,
  rtvc: 15,
  laverdad: 16,
  ceutaactualidad: 17,
  prensa: 18,
}

function pickMostRelevant(articles: ParsedArticle[]): ParsedArticle | null {
  if (articles.length === 0) return null
  return articles.slice().sort((a, b) => {
    const pa = SOURCE_PRIORITY[a.source] ?? 99
    const pb = SOURCE_PRIORITY[b.source] ?? 99
    if (pa !== pb) return pa - pb
    // Same source — prefer most recently published
    return (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')
  })[0]
}

const MAX_ARTICLE_AGE_MS = 5 * 24 * 60 * 60 * 1000 // 5 days

function isRecent(publishedAt: string | null): boolean {
  if (!publishedAt) return true // no date → don't discard
  return Date.now() - new Date(publishedAt).getTime() < MAX_ARTICLE_AGE_MS
}

async function syncNews() {
  const t0 = Date.now()

  const results = await Promise.allSettled([
    (async () => {
      const articles = (await fetchAdceutaOfficialNews(15)).filter((a) => isRecent(a.publishedAt))
      const newArticles = await repo.upsertArticles(articles)
      return { source: 'oficial', count: articles.length, newArticles }
    })(),
    ...RSS_SOURCES.filter((s) => s.id !== 'oficial').map(async (source) => {
      const articles = (await fetchSource(source)).filter((a) => isRecent(a.publishedAt))
      const newArticles = await repo.upsertArticles(articles)
      return { source: source.id, count: articles.length, newArticles }
    }),
    (async () => {
      const articles = (await fetchGoogleNews()).filter((a) => isRecent(a.publishedAt))
      const newArticles = await repo.upsertArticles(articles)
      return { source: 'google-news', count: articles.length, newArticles }
    })(),
  ])

  const allNew: ParsedArticle[] = []
  const summary = results.map((r) => {
    if (r.status === 'fulfilled') {
      allNew.push(...r.value.newArticles)
      return { source: r.value.source, count: r.value.count, new: r.value.newArticles.length }
    }
    return { error: (r.reason as Error)?.message }
  })

  // Enrich new articles without images by fetching og:image
  await Promise.all(
    allNew
      .filter((a) => !a.imageUrl && a.url)
      .map(async (a) => {
        const imageUrl = await fetchOgImage(a.url)
        if (imageUrl) {
          a.imageUrl = imageUrl
          await repo.updateImageUrl(a.externalId, imageUrl)
        }
      })
  )

  // Only notify about articles published in the last 24 hours.
  // Google News can reindex old articles with today's pubDate — so we also
  // reject anything whose real publishedAt is older than 24h, which filters
  // out articles re-surfaced from weeks/months ago.
  const ONE_DAY = 24 * 60 * 60 * 1000
  const recentNew = allNew.filter((a) => {
    if (!a.publishedAt) return false
    return Date.now() - new Date(a.publishedAt).getTime() < ONE_DAY
  })
  const toNotify = pickMostRelevant(recentNew)
  let notifStats = null
  if (toNotify) {
    // Check if a very similar title was already notified in the last 6 hours
    const SIX_HOURS_AGO = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    const { data: recentNotifs } = await supabase
      .from('notification_logs')
      .select('article_title')
      .gte('created_at', SIX_HOURS_AGO)

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-záéíóúüñ0-9]/g, '')
    const titleNorm = normalize(toNotify.title)
    const alreadySent = (recentNotifs ?? []).some(
      (n) =>
        normalize(n.article_title).includes(titleNorm.slice(0, 40)) ||
        titleNorm.includes(normalize(n.article_title).slice(0, 40))
    )

    if (alreadySent) {
      notifStats = null
    } else {
      notifStats = await sendNewsNotification(toNotify).catch(() => null)
    }
    if (notifStats) {
      await logNotification({
        articleTitle: toNotify.title,
        articleSource: toNotify.source,
        articleUrl: toNotify.url,
        recipients: notifStats.recipients,
        sentOk: notifStats.sentOk,
        sentFail: notifStats.sentFail,
      })
    }
  }

  // Get current subscriber count for the log
  const { count: subscribers } = await supabase
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })

  const articlesFound = results.reduce(
    (acc, r) => acc + (r.status === 'fulfilled' ? r.value.count : 0),
    0
  )
  const newArticles = allNew.length

  await logCron('news', 'success', Date.now() - t0, {
    articlesFound,
    newArticles,
    subscribers: subscribers ?? 0,
    notified: toNotify?.title ?? null,
    summary,
  })

  return { summary, notified: toNotify?.title ?? null }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret === process.env.TEST_SECRET) {
    const result = await syncNews()
    return NextResponse.json({ ok: true, ...result })
  }

  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  })

  const body = await request.text()
  const valid = await receiver
    .verify({
      signature: request.headers.get('Upstash-Signature') ?? '',
      body,
    })
    .catch(() => false)

  if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await syncNews()
  return NextResponse.json({ ok: true, ...result })
}

// Llamada manual (dev o producción con TEST_SECRET)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const testSecret = process.env.TEST_SECRET

  if (process.env.NODE_ENV === 'production' && secret !== testSecret) {
    return NextResponse.json({ error: 'Use POST via QStash in production' }, { status: 405 })
  }

  const result = await syncNews()
  return NextResponse.json({ ok: true, ...result })
}
