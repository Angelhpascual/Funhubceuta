import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { RSS_SOURCES } from '@/infrastructure/rss/sources'
import { fetchSource, ParsedArticle } from '@/infrastructure/rss/RssFetcher'
import { fetchAdceutaOfficialNews } from '@/infrastructure/rss/adceutaFetcher'
import { NewsSupabaseRepository } from '@/infrastructure/supabase/NewsSupabaseRepository'
import { sendNewsNotification } from '@/infrastructure/push/sendNewsNotification'

const repo = new NewsSupabaseRepository()

// Source priority for picking the most relevant new article to notify about
const SOURCE_PRIORITY: Record<string, number> = {
  oficial: 0,
  faro: 1,
  elpueblo: 2,
  marca: 3,
  mundodeportivo: 4,
  '20minutos': 5,
  elmundo: 6,
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
  const results = await Promise.allSettled([
    // Official site via WordPress REST API (has featured images)
    (async () => {
      const articles = await fetchAdceutaOfficialNews(15)
      const newArticles = await repo.upsertArticles(articles)
      return { source: 'oficial', count: articles.length, newArticles }
    })(),
    // RSS sources
    ...RSS_SOURCES.filter(s => s.id !== 'oficial').map(async (source) => {
      const articles = await fetchSource(source)
      const newArticles = await repo.upsertArticles(articles)
      return { source: source.id, count: articles.length, newArticles }
    }),
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
  if (toNotify) {
    await sendNewsNotification(toNotify).catch(() => null)
  }

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
