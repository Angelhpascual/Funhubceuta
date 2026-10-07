export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { logCron } from '@/infrastructure/supabase/logCron'
import { Receiver } from '@upstash/qstash'
import {
  scrapeNextMatches,
  scrapeRecentForm,
  scrapeRecentResults,
} from '@/infrastructure/scrapers/adceutaScraper'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { setConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { fetchEspnMatchResult } from '@/infrastructure/espn/fetchMatchResult'

const repo = new MatchesSupabaseRepository()

// The club's own site is the only source for upcoming fixtures/ticket links,
// but it's an unreliable source for closing out *results* — it can lag days
// behind or never publish a given match (seen with Castellón-Ceuta, which
// stayed 'scheduled' with no score for 3 days). ESPN has the final score the
// moment the match ends, so it's now the authority for marking a match
// 'finished', independent of whether the live cron was tracking it live.
async function closeFinishedMatchesFromEspn() {
  const pending = await repo.fetchUnfinishedPast()
  const closed: string[] = []

  for (const match of pending) {
    const espnResult = await fetchEspnMatchResult(match.espnEventId)
    if (!espnResult || espnResult.state !== 'post') continue

    const ceutaIsHome = match.homeTeam.toLowerCase().includes('ceuta')
    const ceutaScore = ceutaIsHome ? espnResult.homeScore : espnResult.awayScore
    const rivalScore = ceutaIsHome ? espnResult.awayScore : espnResult.homeScore
    const result = ceutaScore > rivalScore ? 'W' : ceutaScore < rivalScore ? 'L' : 'D'

    await repo.markMatchFinished(match.espnEventId, espnResult.homeScore, espnResult.awayScore, result)
    closed.push(match.espnEventId)
  }

  return closed
}

async function syncMatches() {
  const t0 = Date.now()
  const closed = await closeFinishedMatchesFromEspn()

  const [matches, scrapedForm, results] = await Promise.all([
    scrapeNextMatches(),
    scrapeRecentForm(),
    scrapeRecentResults(10),
  ])

  await repo.upsertMatches(matches)
  await repo.upsertResults(results)

  // Prefer the DB-derived form (now kept current by closeFinishedMatchesFromEspn
  // above) over the club site's scrape, which shares the same staleness problem.
  const dbForm = await repo.fetchRecentForm(5)
  const form = dbForm.length > 0 ? dbForm : scrapedForm
  if (form.length > 0) {
    await setConfig('ceuta_form', form.join(','))
  }

  const result = { matches: matches.length, form, closedViaEspn: closed }
  await logCron('matches', 'success', Date.now() - t0, result)
  return result
}

async function syncMatchesSafe() {
  const t0 = Date.now()
  try {
    return await syncMatches()
  } catch (err) {
    await logCron('matches', 'error', Date.now() - t0, { error: String(err) })
    throw err
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret === process.env.TEST_SECRET) {
    const count = await syncMatchesSafe()
    return NextResponse.json({ ok: true, count })
  }

  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  })

  const body = await request.text()
  const valid = await receiver
    .verify({ signature: request.headers.get('Upstash-Signature') ?? '', body })
    .catch(() => false)

  if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const count = await syncMatchesSafe()
  return NextResponse.json({ ok: true, count })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (process.env.NODE_ENV === 'production' && secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Use POST via QStash in production' }, { status: 405 })
  }
  const count = await syncMatchesSafe()
  return NextResponse.json({ ok: true, count })
}
