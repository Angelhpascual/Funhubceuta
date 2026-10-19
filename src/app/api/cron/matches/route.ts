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
import { closeFinishedMatchesFromEspn, persistCeutaForm } from '@/infrastructure/matches/closeFinishedMatches'

const repo = new MatchesSupabaseRepository()

// closeFinishedMatchesFromEspn also runs on its own, much more frequent cron
// (cron/close-finished-matches) — kept here too as a second pass on top of
// the weekly fixture refresh, since it's cheap and idempotent.
async function syncMatches() {
  const t0 = Date.now()
  const closed = await closeFinishedMatchesFromEspn(repo)

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
  await persistCeutaForm(form)

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
