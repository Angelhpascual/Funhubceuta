import { setConfig, getConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import type { LiveMatch } from '@/domain/match/LiveMatch'
import { getAppEnv } from '@/lib/appEnv'
import { enqueueLiveTick } from './enqueueLiveTick'

const LIVE_ACTIVE_KEY = 'live_active'
const LIVE_ACTIVATED_AT_KEY = 'live_activated_at'

async function loadPreMock() {
  const { data } = await supabaseAdmin
    .from('matches')
    .select('home_team, away_team, home_team_logo, away_team_logo, venue, date, time')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(1)
    .single()

  const homeTeam = data?.home_team ?? 'Rival'
  const awayTeam = data?.away_team ?? 'AD Ceuta FC'
  const venue    = data?.venue ?? ''

  // Combine date + time if available (e.g. "2026-08-15" + "20:00" → ISO string)
  // `date` may come back as a plain date ("2026-08-15") or a full timestamp
  // ("2026-08-15 00:00:00+00") depending on the column type — normalize to
  // just the date part before appending the time.
  let startDate = new Date().toISOString()
  if (data?.date) {
    const datePart = String(data.date).slice(0, 10)
    const dateStr = data.time ? `${datePart}T${data.time}:00` : `${datePart}T00:00:00`
    const parsed = new Date(dateStr)
    if (!Number.isNaN(parsed.getTime())) startDate = parsed.toISOString()
  }

  const mock: LiveMatch = {
    espnId: 'mock-001',
    homeTeam,
    awayTeam,
    homeScore: 0,
    awayScore: 0,
    events: [],
    venue,
    startDate,
    clock: '',
    status: '',
    state: 'pre',
  }
  await setConfig('live_match_mock', JSON.stringify(mock))
}

export async function activateLive(): Promise<{ ok: true; scheduleId: string | null; already?: boolean }> {
  // Always load next match mock on activate (sets crests, time, and pre state)
  await loadPreMock()

  // In preview/local: just flip the flag — no QStash needed
  if (getAppEnv() !== 'production') {
    await setConfig(LIVE_ACTIVE_KEY, 'true')
    await setConfig(LIVE_ACTIVATED_AT_KEY, new Date().toISOString())
    return { ok: true, scheduleId: null }
  }

  // Production: live mode is driven by a self-chaining QStash *message* (each
  // /api/cron/live run queues the next one) rather than a per-minute schedule,
  // so it never competes for the plan's limited schedule slots.
  const alreadyActive = (await getConfig(LIVE_ACTIVE_KEY)) === 'true'
  if (alreadyActive) {
    return { ok: true, already: true, scheduleId: null }
  }

  await setConfig(LIVE_ACTIVE_KEY, 'true')
  await setConfig(LIVE_ACTIVATED_AT_KEY, new Date().toISOString())
  try {
    await enqueueLiveTick(0)
  } catch (err) {
    // Don't leave live_active=true with nothing driving it.
    await setConfig(LIVE_ACTIVE_KEY, 'false')
    throw err
  }

  return { ok: true, scheduleId: null }
}
