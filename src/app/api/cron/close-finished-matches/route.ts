export const maxDuration = 30

import { NextResponse } from 'next/server'
import { verifyCronRequest, cronUnauthorized } from '@/infrastructure/cron/auth'
import { logCron } from '@/infrastructure/supabase/logCron'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { closeFinishedMatchesFromEspn, persistCeutaForm } from '@/infrastructure/matches/closeFinishedMatches'

const repo = new MatchesSupabaseRepository()

// Runs every ~20 min, independent of the heavy weekly fixture-refresh in
// cron/matches — closing out a finished result shouldn't ever have to wait
// for that cron's next run (confirmed it can be up to a week: Ceuta-Oviedo,
// 2026-10-18, finished same day but stayed 'scheduled' until this cron was
// added). Cheap: just the ESPN lookup for whatever's still 'scheduled' and
// in the past (or today), no scraping.
async function runSafe() {
  const t0 = Date.now()
  try {
    const closed = await closeFinishedMatchesFromEspn(repo)
    const form = await repo.fetchRecentForm(5)
    await persistCeutaForm(form)
    const result = { closedViaEspn: closed, form }
    await logCron('close-finished-matches', 'success', Date.now() - t0, result)
    return result
  } catch (err) {
    await logCron('close-finished-matches', 'error', Date.now() - t0, { error: String(err) })
    throw err
  }
}

export async function POST(request: Request) {
  if (!(await verifyCronRequest(request))) return cronUnauthorized()
  const result = await runSafe()
  return NextResponse.json({ ok: true, ...result })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (process.env.NODE_ENV === 'production' && secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Use POST via QStash in production' }, { status: 405 })
  }
  const result = await runSafe()
  return NextResponse.json({ ok: true, ...result })
}
