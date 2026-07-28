import { NextResponse } from 'next/server'
import { Client } from '@upstash/qstash'
import { setConfig, getConfig, deleteConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import type { LiveMatch } from '@/domain/match/LiveMatch'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'

const QSTASH_SCHEDULE_KEY = 'live_qstash_schedule_id'
const LIVE_ACTIVE_KEY = 'live_active'

function qstash() {
  return new Client({ token: process.env.QSTASH_TOKEN! })
}

function liveUrl() {
  const base =
    process.env.VERCEL_ENV === 'production'
      ? (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://adceutainfo.vercel.app')
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'
  return `${base}/api/cron/live`
}

export async function GET() {
  const active = await getConfig(LIVE_ACTIVE_KEY)
  const scheduleId = await getConfig(QSTASH_SCHEDULE_KEY)
  const lastResultRaw = await getConfig('live_last_result')
  let lastResult: { homeTeam: string; awayTeam: string; homeScore: number; awayScore: number; savedAt: string } | null = null
  if (lastResultRaw) {
    try {
      const r = JSON.parse(lastResultRaw)
      const ageDays = (Date.now() - new Date(r.savedAt ?? 0).getTime()) / 86_400_000
      if (ageDays < 3) {
        lastResult = { homeTeam: r.homeTeam, awayTeam: r.awayTeam, homeScore: r.homeScore, awayScore: r.awayScore, savedAt: r.savedAt }
      }
    } catch { /* ignore */ }
  }
  return NextResponse.json({ active: active === 'true', scheduleId, lastResult })
}

export async function PATCH(req: Request) {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const body = await req.json().catch(() => ({}))
  if (body.action === 'activate_result') {
    // Save current mock (or last known state) as the recent result
    const mockRaw = await getConfig('live_match_mock')
    if (mockRaw) {
      try {
        const mock = JSON.parse(mockRaw) as LiveMatch
        const result = { ...mock, state: 'post' as const, savedAt: new Date().toISOString() }
        await setConfig('live_last_result', JSON.stringify(result))
        return NextResponse.json({ ok: true })
      } catch { /* ignore */ }
    }
    return NextResponse.json({ ok: false, error: 'No hay partido preparado' }, { status: 400 })
  }
  // Default: deactivate / clear result
  await deleteConfig('live_last_result')
  return NextResponse.json({ ok: true })
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
  let startDate = new Date().toISOString()
  if (data?.date) {
    const dateStr = data.time ? `${data.date}T${data.time}:00` : `${data.date}T00:00:00`
    startDate = new Date(dateStr).toISOString()
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

export async function POST() {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  // Always load next match mock on activate (sets crests, time, and pre state)
  await loadPreMock()

  // In preview/local: just flip the flag — no QStash needed
  if (process.env.VERCEL_ENV !== 'production') {
    await setConfig(LIVE_ACTIVE_KEY, 'true')
    return NextResponse.json({ ok: true, scheduleId: null })
  }

  // Production: create QStash schedule for real cron
  const existing = await getConfig(QSTASH_SCHEDULE_KEY)
  if (existing) {
    return NextResponse.json({ ok: true, already: true, scheduleId: existing })
  }

  const client = qstash()
  const schedule = await client.schedules.create({
    destination: liveUrl(),
    cron: '* * * * *',
  })

  await setConfig(LIVE_ACTIVE_KEY, 'true')
  await setConfig(QSTASH_SCHEDULE_KEY, schedule.scheduleId)

  return NextResponse.json({ ok: true, scheduleId: schedule.scheduleId })
}

export async function DELETE() {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  // In preview/local: just clear flags
  if (process.env.VERCEL_ENV !== 'production') {
    await setConfig(LIVE_ACTIVE_KEY, 'false')
    await deleteConfig('live_match_state')
    await deleteConfig('live_match_mock')
    return NextResponse.json({ ok: true })
  }

  // Production: also delete QStash schedule
  const scheduleId = await getConfig(QSTASH_SCHEDULE_KEY)
  if (scheduleId) {
    try {
      const client = qstash()
      await client.schedules.delete(scheduleId)
    } catch {
      // Schedule may already be gone — continue cleanup
    }
    await deleteConfig(QSTASH_SCHEDULE_KEY)
  }
  await setConfig(LIVE_ACTIVE_KEY, 'false')
  await deleteConfig('live_match_state')
  await deleteConfig('live_match_mock')

  return NextResponse.json({ ok: true })
}
