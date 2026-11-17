import { NextResponse } from 'next/server'
import { verifyCronRequest, cronUnauthorized } from '@/infrastructure/cron/auth'
import { getConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { madridDateTimeToUtc } from '@/lib/madridTime'
import { activateLive } from '@/infrastructure/live/activateLive'
import { logCron } from '@/infrastructure/supabase/logCron'

const PRE_KICKOFF_WINDOW_MS = 15 * 60 * 1000
const POST_KICKOFF_SAFETY_WINDOW_MS = 90 * 60 * 1000

const repo = new MatchesSupabaseRepository()

async function autoActivateLive() {
  const t0 = Date.now()
  try {
    const alreadyActive = (await getConfig('live_active')) === 'true'
    if (alreadyActive) {
      const result = { skipped: 'already-active' as const }
      await logCron('auto-activate-live', 'success', Date.now() - t0, result)
      return result
    }

    const next = await repo.getNextMatch()
    if (!next) {
      const result = { skipped: 'no-upcoming-match' as const }
      await logCron('auto-activate-live', 'success', Date.now() - t0, result)
      return result
    }

    const kickoff = madridDateTimeToUtc(next.date, next.time)
    const now = Date.now()
    const withinWindow =
      now >= kickoff.getTime() - PRE_KICKOFF_WINDOW_MS &&
      now <= kickoff.getTime() + POST_KICKOFF_SAFETY_WINDOW_MS

    if (!withinWindow) {
      const result = { skipped: 'outside-window' as const, kickoff: kickoff.toISOString() }
      await logCron('auto-activate-live', 'success', Date.now() - t0, result)
      return result
    }

    const activated = await activateLive()
    const result = { activated: true as const, ...activated }
    await logCron('auto-activate-live', 'success', Date.now() - t0, result)
    return result
  } catch (err) {
    await logCron('auto-activate-live', 'error', Date.now() - t0, { error: String(err) })
    throw err
  }
}

export async function POST(request: Request) {
  if (!(await verifyCronRequest(request))) return cronUnauthorized()
  const { searchParams } = new URL(request.url)
  const testMode = searchParams.get('test') === 'true'
  const result = await autoActivateLive()
  return NextResponse.json({ ok: true, testMode: testMode || undefined, ...result })
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST in production' }, { status: 405 })
  }
  const { searchParams } = new URL(request.url)
  const testMode = searchParams.get('test') === 'true'
  const result = await autoActivateLive()
  return NextResponse.json({ ok: true, testMode: testMode || undefined, ...result })
}
