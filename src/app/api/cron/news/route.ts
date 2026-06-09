import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { RSS_SOURCES } from '@/infrastructure/rss/sources'
import { fetchSource, ParsedArticle } from '@/infrastructure/rss/RssFetcher'
import { fetchAdceutaOfficialNews } from '@/infrastructure/rss/adceutaFetcher'
import { fetchGoogleNews } from '@/infrastructure/rss/googleNewsFetcher'
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
  ceutatv: 7,
  rtvc: 8,
  laverdad: 9,
  ceutaactualidad: 10,
  as: 11,
  confidencial: 12,
  abc: 13,
  lavanguardia: 14,
  cope: 15,
  ser: 16,
  onefootball: 17,
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

async function syncNews() {
  const t0 = Date.now()

  const results = await Promise.allSettled([
    (async () => {
      const articles = await fetchAdceutaOfficialNews(15)
      const newArticles = await repo.upsertArticles(articles)
      return { source: 'oficial', count: articles.length, newArticles }
    })(),
    ...RSS_SOURCES.filter(s => s.id !== 'oficial').map(async (source) => {
      const articles = await fetchSource(source)
      const newArticles = await repo.upsertArticles(articles)
      return { source: source.id, count: articles.length, newArticles }
    }),
    (async () => {
      const articles = await fetchGoogleNews()
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

  const toNotify = pickMostRelevant(allNew)
  let notifStats = null
  if (toNotify) {
    notifStats = await sendNewsNotification(toNotify).catch(() => null)
    if (notifStats) {
      await logNotification({
        articleTitle:  toNotify.title,
        articleSource: toNotify.source,
        articleUrl:    toNotify.url,
        recipients:    notifStats.recipients,
        sentOk:        notifStats.sentOk,
        sentFail:      notifStats.sentFail,
      })
    }
  }

  // Get current subscriber count for the log
  const { count: subscribers } = await supabase
    .from('push_subscriptions').select('*', { count: 'exact', head: true })

  const articlesFound = results.reduce((acc, r) => acc + (r.status === 'fulfilled' ? r.value.count : 0), 0)
  const newArticles   = allNew.length

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
  const valid = await receiver.verify({
    signature: request.headers.get('Upstash-Signature') ?? '',
    body,
  }).catch(() => false)

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
