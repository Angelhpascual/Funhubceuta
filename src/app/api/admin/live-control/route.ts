import { NextResponse } from 'next/server'
import { Client } from '@upstash/qstash'
import { setConfig, getConfig, deleteConfig } from '@/infrastructure/supabase/AppConfigRepository'

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
  return NextResponse.json({ active: active === 'true', scheduleId })
}

export async function POST() {
  // In preview/local: just flip the flag — no QStash needed (mock provides data)
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
  // In preview/local: just clear flags
  if (process.env.VERCEL_ENV !== 'production') {
    await setConfig(LIVE_ACTIVE_KEY, 'false')
    await deleteConfig('live_match_state')
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

  return NextResponse.json({ ok: true })
}
