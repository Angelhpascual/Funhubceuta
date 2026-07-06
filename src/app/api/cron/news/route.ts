import { NextResponse } from 'next/server'

export const maxDuration = 60
import { Receiver } from '@upstash/qstash'
import { RSS_SOURCES } from '@/infrastructure/rss/sources'
import { fetchSource, ParsedArticle } from '@/infrastructure/rss/RssFetcher'
import { fetchAdceutaOfficialNews } from '@/infrastructure/rss/adceutaFetcher'
import { fetchCeutaDeportiva } from '@/infrastructure/rss/ceutadeportivaFetcher'
import { fetchOgImage } from '@/infrastructure/rss/fetchOgImage'
import { NewsSupabaseRepository } from '@/infrastructure/supabase/NewsSupabaseRepository'
import { sendNewsNotification } from '@/infrastructure/push/sendNewsNotification'
import { notifyAdmin } from '@/infrastructure/push/notifyAdmin'
import { logCron, logNotification } from '@/infrastructure/supabase/logCron'
import { getRecentNotifTitles, markNotifyQueued, getSubscriberCount } from '@/infrastructure/supabase/NotificationRepository'
import {
  downloadAndUploadImage,
  isStoredNewsImage,
  newsImageFilename,
} from '@/infrastructure/storage/imageUploader'

const repo = new NewsSupabaseRepository()

// Source priority for picking the most relevant new article to notify about
const SOURCE_PRIORITY: Record<string, number> = {
  oficial: 0,
  faro: 1,
  ceutadeportiva: 2,
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
  ceutaaldia: 18,
  teleceuta: 19,
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
  if (!publishedAt) return false // no date → discard (can't verify age)
  return Date.now() - new Date(publishedAt).getTime() < MAX_ARTICLE_AGE_MS
}

async function storeArticleImage(article: ParsedArticle): Promise<{ ok: boolean; failed: boolean }> {
  if (!article.imageUrl || isStoredNewsImage(article.imageUrl)) return { ok: false, failed: false }

  const storedUrl = await downloadAndUploadImage(
    article.imageUrl,
    newsImageFilename(article.source, article.externalId)
  )

  if (!storedUrl) return { ok: false, failed: true }
  article.imageUrl = storedUrl
  await repo.updateImageUrl(article.externalId, storedUrl)
  return { ok: true, failed: false }
}

async function backfillLatestRemoteImages(limit = 20): Promise<number> {
  const rows = await repo.getLatestRowsWithImages(limit)
  let optimized = 0

  await Promise.all(
    rows
      .filter((row) => !isStoredNewsImage(row.imageUrl))
      .slice(0, 6)
      .map(async (row) => {
        const storedUrl = await downloadAndUploadImage(
          row.imageUrl,
          newsImageFilename(row.source, row.externalId)
        )
        if (!storedUrl) return
        await repo.updateImageUrlById(row.id, storedUrl)
        optimized += 1
      })
  )

  return optimized
}

async function syncNews() {
  const t0 = Date.now()

  const results = await Promise.allSettled([
    (async () => {
      const articles = (await fetchAdceutaOfficialNews(15)).filter((a) => isRecent(a.publishedAt))
      const newArticles = await repo.upsertArticles(articles)
      return { source: 'oficial', count: articles.length, newArticles }
    })(),
    (async () => {
      const articles = (await fetchCeutaDeportiva(8)).filter((a) => isRecent(a.publishedAt))
      const newArticles = await repo.upsertArticles(articles)
      return { source: 'ceutadeportiva', count: articles.length, newArticles }
    })(),
    ...RSS_SOURCES.filter((s) => s.id !== 'oficial').map(async (source) => {
      const articles = (await fetchSource(source)).filter((a) => isRecent(a.publishedAt))
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

  const articlesWithImages = allNew.filter((a) => a.imageUrl)
  const imageStoreResults = await Promise.all(
    articlesWithImages.map(async (a) => ({ title: a.title, url: a.url, ...(await storeArticleImage(a)) }))
  )
  const optimizedNewImages = imageStoreResults.filter((r) => r.ok).length
  const imageErrors = imageStoreResults
    .filter((r) => r.failed)
    .map((r) => ({ title: r.title, url: r.url }))
  const noImageArticles = allNew.filter((a) => !a.imageUrl).length

  const backfilledImages = 0 // moved to dedicated /api/cron/backfill-images

  // Only notify about articles published in the last 24 hours.
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
    const recentTitles = await getRecentNotifTitles(SIX_HOURS_AGO)

    // Extract meaningful keywords (words > 4 chars, ignore stopwords)
    const STOPWORDS = new Set(['ceuta', 'para', 'como', 'pero', 'este', 'esta', 'desde', 'hasta', 'sobre', 'entre', 'todos', 'tiene', 'tras'])
    const keywords = (s: string): Set<string> => {
      const words = s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').split(/\s+/)
      return new Set(words.filter(w => w.length > 4 && !STOPWORDS.has(w)))
    }
    const titleKw = keywords(toNotify.title)
    const alreadySent = recentTitles.some((title) => {
      const sentKw = keywords(title)
      if (titleKw.size === 0 || sentKw.size === 0) return false
      let overlap = 0
      for (const w of titleKw) if (sentKw.has(w)) overlap++
      const minSize = Math.min(titleKw.size, sentKw.size)
      return overlap / minSize >= 0.4
    })

    if (!alreadySent) {
      await markNotifyQueued(toNotify.externalId)
      await notifyAdmin('📬 Noticia pendiente', toNotify.title).catch(() => null)
    }
  }

  // Get current subscriber count for the log
  const subscribers = await getSubscriberCount()

  const articlesFound = results.reduce(
    (acc, r) => acc + (r.status === 'fulfilled' ? r.value.count : 0),
    0
  )
  const newArticles = allNew.length

  await logCron('news', 'success', Date.now() - t0, {
    articlesFound,
    newArticles,
    optimizedNewImages,
    backfilledImages,
    imageErrors: imageErrors.length > 0 ? imageErrors : undefined,
    noImageArticles: noImageArticles > 0 ? noImageArticles : undefined,
    subscribers,
    queued: toNotify?.title ?? null,
    summary,
  })

  return { summary, queued: toNotify?.title ?? null }
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
