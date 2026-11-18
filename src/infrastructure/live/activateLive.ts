import { Client } from '@upstash/qstash'
import { setConfig, getConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import type { LiveMatch } from '@/domain/match/LiveMatch'
import { getAppEnv } from '@/lib/appEnv'

const QSTASH_SCHEDULE_KEY = 'live_qstash_schedule_id'
const LIVE_ACTIVE_KEY = 'live_active'

function qstash() {
  return new Client({ token: process.env.QSTASH_TOKEN! })
}

function liveUrl() {
  const base =
    getAppEnv() === 'production'
      ? (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://adceutainfo.vercel.app')
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'
  return `${base}/api/cron/live`
}

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
    return { ok: true, scheduleId: null }
  }

  // Production: create QStash schedule for real cron
  const existing = await getConfig(QSTASH_SCHEDULE_KEY)
  if (existing) {
    return { ok: true, already: true, scheduleId: existing }
  }

  const client = qstash()
  const schedule = await client.schedules.create({
    destination: liveUrl(),
    cron: '* * * * *',
  })

  await setConfig(LIVE_ACTIVE_KEY, 'true')
  await setConfig(QSTASH_SCHEDULE_KEY, schedule.scheduleId)

  return { ok: true, scheduleId: schedule.scheduleId }
}
