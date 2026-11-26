import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest, cronUnauthorized } from '@/infrastructure/cron/auth'
import { scrapeLatestTweets } from '@/infrastructure/scrapers/twitterScraper'
import { upsertTweets } from '@/infrastructure/supabase/TweetsRepository'
import { logCron } from '@/infrastructure/supabase/logCron'
import { runCron, alertCronProblem } from '@/infrastructure/cron/runCron'
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
  if (!(await verifyCronRequest(request))) return cronUnauthorized()
  const count = await runCron('tweets', syncTweets, { isEmpty: (n) => n === 0 })
  return NextResponse.json({ ok: true, count })
})

export const GET = withApi(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST via QStash in production' }, { status: 405 })
  }
  const count = await syncTweets()
  return NextResponse.json({ ok: true, count })
})
