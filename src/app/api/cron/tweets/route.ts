import { NextRequest, NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { scrapeLatestTweets } from '@/infrastructure/scrapers/twitterScraper'
import { upsertTweets } from '@/infrastructure/supabase/TweetsRepository'
import { logCron } from '@/infrastructure/supabase/logCron'
import { withApi } from '@/lib/apiError'

async function syncTweets() {
  const t0 = Date.now()
  const tweets = await scrapeLatestTweets('ADCeuta_FC', 20)

  if (tweets.length === 0) {
    await logCron('tweets', 'success', Date.now() - t0, { tweets: 0 })
    return 0
  }

  await upsertTweets(tweets)
  await logCron('tweets', 'success', Date.now() - t0, { tweets: tweets.length })
  return tweets.length
}

export const POST = withApi(async (request: Request) => {
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  })
  const body = await request.text()
  const valid = await receiver
    .verify({ signature: request.headers.get('Upstash-Signature') ?? '', body })
    .catch(() => false)

  if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const count = await syncTweets()
  return NextResponse.json({ ok: true, count })
})

export const GET = withApi(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST via QStash in production' }, { status: 405 })
  }
  const count = await syncTweets()
  return NextResponse.json({ ok: true, count })
})
