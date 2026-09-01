import { NextResponse } from 'next/server'
import { Client } from '@upstash/qstash'
import { setConfig, getConfig, deleteConfig } from '@/infrastructure/supabase/AppConfigRepository'
import type { LiveMatch } from '@/domain/match/LiveMatch'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { activateLive } from '@/infrastructure/live/activateLive'

const QSTASH_SCHEDULE_KEY = 'live_qstash_schedule_id'
const LIVE_ACTIVE_KEY = 'live_active'

function qstash() {
  return new Client({ token: process.env.QSTASH_TOKEN! })
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

export async function POST() {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  return NextResponse.json(await activateLive())
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
