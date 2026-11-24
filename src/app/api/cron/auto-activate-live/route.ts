import { NextResponse } from 'next/server'
import { verifyCronRequest, cronUnauthorized } from '@/infrastructure/cron/auth'
import { getConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { madridDateTimeToUtc } from '@/lib/madridTime'
import { activateLive } from '@/infrastructure/live/activateLive'
import { enqueueLiveTick } from '@/infrastructure/live/enqueueLiveTick'
import { logCron } from '@/infrastructure/supabase/logCron'

// If live is on but the self-chaining tick has been silent this long, the chain
// broke (a failed enqueue, a dropped message): restart it.
const TICK_STALE_MS = 3 * 60 * 1000
const PRE_KICKOFF_WINDOW_MS = 15 * 60 * 1000
const POST_KICKOFF_SAFETY_WINDOW_MS = 90 * 60 * 1000

const repo = new MatchesSupabaseRepository()

async function autoActivateLive() {
  const t0 = Date.now()
  try {
    const alreadyActive = (await getConfig('live_active')) === 'true'
    if (alreadyActive) {
      const lastTickRaw = await getConfig('live_last_tick')
      const lastTick = lastTickRaw ? new Date(lastTickRaw).getTime() : NaN
      const stale = !Number.isFinite(lastTick) || Date.now() - lastTick > TICK_STALE_MS
      if (stale) {
        await enqueueLiveTick(0)
        const result = { restartedTick: true as const }
        await logCron('auto-activate-live', 'success', Date.now() - t0, result)
        return result
      }
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
