import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { RSS_SOURCES } from '@/infrastructure/rss/sources'
import { fetchSource } from '@/infrastructure/rss/RssFetcher'
import { NewsSupabaseRepository } from '@/infrastructure/supabase/NewsSupabaseRepository'

const repo = new NewsSupabaseRepository()

async function syncNews() {
  const results = await Promise.allSettled(
    RSS_SOURCES.map(async (source) => {
      const articles = await fetchSource(source)
      await repo.upsertArticles(articles)
      return { source: source.id, count: articles.length }
    })
  )

  return results.map((r) =>
    r.status === 'fulfilled' ? r.value : { error: r.reason?.message }
  )
}

// Llamada desde QStash (verifica firma)
export async function POST(request: Request) {
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  })

  const body = await request.text()

  const valid = await receiver.verify({
    signature: request.headers.get('Upstash-Signature') ?? '',
    body,
  }).catch(() => false)

  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const summary = await syncNews()
  return NextResponse.json({ ok: true, summary })
}

// Llamada manual desde local/dev (sin verificación)
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST via QStash in production' }, { status: 405 })
  }

  const summary = await syncNews()
  return NextResponse.json({ ok: true, summary })
}
