import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { supabase } from '@/infrastructure/supabase/client'
import webpush from 'web-push'
import type { LiveMatch, LiveEvent } from '@/app/api/live/route'

webpush.setVapidDetails(
  'mailto:angelhpascual@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// ── Fetch live match from ESPN (same logic as /api/live) ──────────────────
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.2'

async function fetchLiveMatch(): Promise<LiveMatch | null> {
  const res = await fetch(`${ESPN}/scoreboard`, { cache: 'no-store' })
  if (!res.ok) return null

  const sb = await res.json()
  const event = (sb.events ?? []).find((e: unknown) =>
    JSON.stringify(e).toLowerCase().includes('ceuta')
  )
  if (!event) return null

  const comp = event.competitions?.[0]
  const statusType = comp?.status?.type
  const home = comp?.competitors?.find((c: Record<string,unknown>) => c.homeAway === 'home')
  const away = comp?.competitors?.find((c: Record<string,unknown>) => c.homeAway === 'away')
  const state: 'pre' | 'in' | 'post' = statusType?.state ?? 'pre'

  let events: LiveEvent[] = []
  if (state === 'in' || state === 'post') {
    const sum = await fetch(`${ESPN}/summary?event=${event.id}`, { cache: 'no-store' })
    if (sum.ok) {
      const sumData = await sum.json()
      events = (sumData.plays ?? [])
        .filter((p: Record<string,unknown>) => {
          const t = ((p.type as Record<string,unknown>)?.text as string ?? '').toLowerCase()
          return t.includes('goal') || t.includes('yellow') || t.includes('red')
        })
        .map((p: Record<string,unknown>) => {
          const t = ((p.type as Record<string,unknown>)?.text as string ?? '').toLowerCase()
          const teamId = (p.team as Record<string,unknown>)?.id
          const athlete = ((p.participants as Record<string,unknown>[])?.[0]?.athlete as Record<string,unknown>)
          return {
            type: t.includes('yellow') ? 'yellowCard' : t.includes('red') ? 'redCard' : 'goal',
            minute: ((p.clock as Record<string,unknown>)?.displayValue as string) ?? '',
            team: teamId === home?.team?.id ? 'home' : 'away',
            playerName: (athlete?.displayName as string) ?? '',
          } satisfies LiveEvent
        })
    }
  }

  return {
    espnId: event.id,
    state,
    status: statusType?.description ?? '',
    clock: state === 'in' ? (comp?.status?.displayClock ?? '') : '',
    homeTeam: home?.team?.displayName ?? '',
    awayTeam: away?.team?.displayName ?? '',
    homeScore: parseInt(home?.score ?? '0'),
    awayScore: parseInt(away?.score ?? '0'),
    events,
    venue: comp?.venue?.fullName ?? '',
    startDate: event.date ?? '',
  }
}

// ── Send push to all subscribers ──────────────────────────────────────────
async function sendPush(title: string, body: string, tag: string) {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')

  if (!subs?.length) return 0

  const payload = JSON.stringify({ title, body, tag, url: '/' })
  let sent = 0

  await Promise.allSettled(
    subs.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (err: unknown) {
        const status = (err as Record<string,unknown>)?.statusCode
        if (status === 410 || status === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    })
  )

  return sent
}

// ── Cached state helpers ──────────────────────────────────────────────────
interface MatchState {
  espnId: string
  homeScore: number
  awayScore: number
  state: string
  eventCount: number
}

async function getStoredState(): Promise<MatchState | null> {
  const { data } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'live_match_state')
    .single()
  if (!data?.value) return null
  try { return JSON.parse(data.value) } catch { return null }
}

async function saveState(state: MatchState) {
  await supabase.from('app_config').upsert(
    { key: 'live_match_state', value: JSON.stringify(state), updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
}

// ── Main logic ────────────────────────────────────────────────────────────
async function checkAndNotify() {
  const match = await fetchLiveMatch()

  if (!match) {
    // No match today — clear stored state
    await supabase.from('app_config').delete().eq('key', 'live_match_state')
    return { match: null, notifications: [] }
  }

  const prev = await getStoredState()
  const notifications: string[] = []

  const newState: MatchState = {
    espnId: match.espnId,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    state: match.state,
    eventCount: match.events.length,
  }

  // ── Match just started ────────────────────────────────────────────────
  if ((!prev || prev.state === 'pre') && match.state === 'in') {
    await sendPush(
      '⚽ Partido en curso',
      `${match.homeTeam} vs ${match.awayTeam} — ¡Ha comenzado!`,
      'kickoff'
    )
    notifications.push('kickoff')
  }

  // ── Goal detected ─────────────────────────────────────────────────────
  if (prev && match.state === 'in') {
    const homeGoals = match.homeScore - prev.homeScore
    const awayGoals = match.awayScore - prev.awayScore

    for (let i = 0; i < homeGoals; i++) {
      const ceutaScored = match.homeTeam.toLowerCase().includes('ceuta')
      const scorer = match.events
        .filter(e => e.type === 'goal' && e.team === 'home')
        .pop()

      await sendPush(
        ceutaScored ? '🚨 ¡¡GOOOOL DEL CEUTA!!' : '⚽ Gol en contra',
        `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}` +
          (scorer ? ` · ${scorer.playerName} ${scorer.minute}` : '') +
          (ceutaScored ? ' 🔥🔥🔥' : ''),
        `goal-home-${match.homeScore}`
      )
      notifications.push(`goal-home-${match.homeScore}`)
    }

    for (let i = 0; i < awayGoals; i++) {
      const ceutaScored = match.awayTeam.toLowerCase().includes('ceuta')
      const scorer = match.events
        .filter(e => e.type === 'goal' && e.team === 'away')
        .pop()

      await sendPush(
        ceutaScored ? '🚨 ¡¡GOOOOL DEL CEUTA!!' : '⚽ Gol en contra',
        `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}` +
          (scorer ? ` · ${scorer.playerName} ${scorer.minute}` : '') +
          (ceutaScored ? ' 🔥🔥🔥' : ''),
        `goal-away-${match.awayScore}`
      )
      notifications.push(`goal-away-${match.awayScore}`)
    }

    // ── Red card ────────────────────────────────────────────────────────
    const prevRedCards = 0 // simplification — track by event count diff
    const newEvents = match.events.slice(prev.eventCount)
    const redCards = newEvents.filter(e => e.type === 'redCard')
    for (const card of redCards) {
      const isCeuta = card.team === (match.homeTeam.toLowerCase().includes('ceuta') ? 'home' : 'away')
      await sendPush(
        isCeuta ? '🟥 Tarjeta roja para el Ceuta' : '🟥 Tarjeta roja rival',
        `${card.playerName} · ${card.minute} — ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`,
        `red-${card.minute}`
      )
      notifications.push(`red-${card.playerName}`)
    }
  }

  // ── Match finished ────────────────────────────────────────────────────
  if (prev?.state === 'in' && match.state === 'post') {
    const ceutaHome = match.homeTeam.toLowerCase().includes('ceuta')
    const ceutaScore = ceutaHome ? match.homeScore : match.awayScore
    const rivalScore = ceutaHome ? match.awayScore : match.homeScore
    const result = ceutaScore > rivalScore ? '¡Victoria! 🏆' : ceutaScore < rivalScore ? 'Derrota 😔' : 'Empate ➕'

    await sendPush(
      `⏱️ Final: ${result}`,
      `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`,
      'fulltime'
    )
    notifications.push('fulltime')
  }

  await saveState(newState)
  return { match: { state: match.state, score: `${match.homeScore}-${match.awayScore}` }, notifications }
}

// ── Routes ────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  })
  const body = await request.text()
  const valid = await receiver.verify({
    signature: request.headers.get('Upstash-Signature') ?? '',
    body,
  }).catch(() => false)

  if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await checkAndNotify()
  return NextResponse.json({ ok: true, ...result })
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST in production' }, { status: 405 })
  }
  const result = await checkAndNotify()
  return NextResponse.json({ ok: true, ...result })
}
