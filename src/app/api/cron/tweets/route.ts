import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { scrapeLatestTweets } from '@/infrastructure/scrapers/twitterScraper'
import { supabase } from '@/infrastructure/supabase/client'
import { logCron } from '@/infrastructure/supabase/logCron'

async function syncTweets() {
  const t0 = Date.now()
  const tweets = await scrapeLatestTweets('ADCeuta_FC', 20)

  if (tweets.length === 0) {
    await logCron('tweets', 'success', Date.now() - t0, { tweets: 0 })
    return 0
  }

  const { error } = await supabase.from('tweets').upsert(
    tweets.map((t) => ({
      tweet_id: t.tweetId,
      text: t.text,
      created_at_twitter: t.createdAt,
      url: t.url,
      image_url: t.imageUrl,
    })),
    { onConflict: 'tweet_id', ignoreDuplicates: true }
  )

  if (error) {
    await logCron('tweets', 'error', Date.now() - t0, { error: error.message })
    throw new Error(`Failed to upsert tweets: ${error.message}`)
  }

  await logCron('tweets', 'success', Date.now() - t0, { tweets: tweets.length })
  return tweets.length
}

export async function POST(request: Request) {
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
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST via QStash in production' }, { status: 405 })
  }
  const count = await syncTweets()
  return NextResponse.json({ ok: true, count })
}
