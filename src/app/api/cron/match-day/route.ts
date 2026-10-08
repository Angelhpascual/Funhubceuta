import { NextRequest, NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import webpush from 'web-push'
import { ESPN_BASE as ESPN } from '@/lib/constants'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { logCron } from '@/infrastructure/supabase/logCron'
import {
  getAllSubscriptions,
  deleteSubscription,
} from '@/infrastructure/supabase/PushSubscriptionsRepository'
import { MSG } from '../live/messages'
import { findCeutaEvent, parseMatchCore, guardMatchState } from '@/infrastructure/espn/parseLiveMatch'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { madridDateTimeToUtc } from '@/lib/madridTime'

const matchesRepo = new MatchesSupabaseRepository()

async function getTodayMatch() {
  const res = await fetchWithTimeout(`${ESPN}/scoreboard`, { cache: 'no-store' }, 15_000)
  if (!res.ok) return null

  const sb = await res.json()
  // Shared parsing (same as cron/live and /api/live) instead of a third,
  // independently-hand-rolled ESPN reader — this file used to parse the
  // scoreboard itself with no corrupt-state guard at all, so the exact ESPN
  // glitch that broke live tracking for Castellón-Ceuta (a 'post'/'in' state
  // seeded before real kickoff) would have silently killed this reminder too.
  const event = findCeutaEvent(sb)
  if (!event) return null

  const core = parseMatchCore(event)
  if (!core) return null

  const dbMatch = await matchesRepo.fetchByEspnId(core.espnId)
  const kickoffIso = dbMatch ? madridDateTimeToUtc(String(dbMatch.date).slice(0, 10), dbMatch.time).toISOString() : null
  const state = guardMatchState(core.state, kickoffIso)

  // Solo notificar si el partido no ha empezado aún
  if (state !== 'pre') return null

  const kickoffTime = core.startDate
    ? new Date(core.startDate).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Madrid',
      })
    : null

  return {
    homeTeam: core.homeTeam,
    awayTeam: core.awayTeam,
    venue: core.venue || 'Alfonso Murube',
    kickoffTime,
  }
}

async function sendMatchDayPush(match: Awaited<ReturnType<typeof getTodayMatch>>) {
  if (!match) return 0

  webpush.setVapidDetails(
    'mailto:angelhpascual@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const subs = await getAllSubscriptions()
  if (!subs.length) return 0

  const ceutaIsHome = match.homeTeam.toLowerCase().includes('ceuta')
  const rival = ceutaIsHome ? match.awayTeam : match.homeTeam
  const msg = MSG.matchDay(rival, match.kickoffTime, ceutaIsHome)

  const payload = JSON.stringify({
    ...msg,
    tag: 'match-day',
    url: '/partidos',
  })

  let sent = 0
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (err: unknown) {
        const status = (err as Record<string, unknown>)?.statusCode
        if (status === 410 || status === 404) await deleteSubscription(sub.endpoint)
      }
    })
  )

  return sent
}

async function runMatchDay() {
  const t0 = Date.now()
  try {
    const match = await getTodayMatch()
    const sent = await sendMatchDayPush(match)
    await logCron('match-day', 'success', Date.now() - t0, { match: match ? 'found' : 'none', sent })
    return { match: match ? 'found' : 'none', sent }
  } catch (err) {
    await logCron('match-day', 'error', Date.now() - t0, { error: String(err) })
    throw err
  }
}

// ── Routes ────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  })
  const body = await request.text()
  const valid = await receiver
    .verify({ signature: request.headers.get('Upstash-Signature') ?? '', body })
    .catch(() => false)

  if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await runMatchDay()
  return NextResponse.json({ ok: true, ...result })
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST in production' }, { status: 405 })
  }
  const result = await runMatchDay()
  return NextResponse.json({ ok: true, ...result })
}
