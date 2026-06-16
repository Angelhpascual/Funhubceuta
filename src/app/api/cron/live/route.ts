import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import webpush from 'web-push'
import type { LiveMatch, LiveEvent } from '@/app/api/live/route'
import { setConfig, deleteConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import { ESPN_BASE as ESPN } from '@/lib/constants'

// ── Fetch live match from ESPN (same logic as /api/live) ──────────────────

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
  const home = comp?.competitors?.find((c: Record<string, unknown>) => c.homeAway === 'home')
  const away = comp?.competitors?.find((c: Record<string, unknown>) => c.homeAway === 'away')
  const state: 'pre' | 'in' | 'post' = statusType?.state ?? 'pre'

  let events: LiveEvent[] = []
  if (state === 'in' || state === 'post') {
    const sum = await fetch(`${ESPN}/summary?event=${event.id}`, { cache: 'no-store' })
    if (sum.ok) {
      const sumData = await sum.json()
      events = (sumData.plays ?? [])
        .filter((p: Record<string, unknown>) => {
          const t = (((p.type as Record<string, unknown>)?.text as string) ?? '').toLowerCase()
          return t.includes('goal') || t.includes('yellow') || t.includes('red')
        })
        .map((p: Record<string, unknown>) => {
          const t = (((p.type as Record<string, unknown>)?.text as string) ?? '').toLowerCase()
          const teamId = (p.team as Record<string, unknown>)?.id
          const athlete = (p.participants as Record<string, unknown>[])?.[0]?.athlete as Record<
            string,
            unknown
          >
          return {
            type: t.includes('yellow') ? 'yellowCard' : t.includes('red') ? 'redCard' : 'goal',
            minute: ((p.clock as Record<string, unknown>)?.displayValue as string) ?? '',
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
async function sendPush(title: string, body: string, tag: string, url = '/partidos') {
  webpush.setVapidDetails(
    'mailto:angelhpascual@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const subs = await import('@/infrastructure/supabase/PushSubscriptionsRepository').then((m) =>
    m.getAllSubscriptions()
  )

  if (!subs.length) return 0

  const payload = JSON.stringify({ title, body, tag, url })
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
        if (status === 410 || status === 404) {
          await deleteSubscription(sub.endpoint)
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
  const { getConfig } = await import('@/infrastructure/supabase/AppConfigRepository')
  const raw = await getConfig('live_match_state')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function saveState(state: MatchState) {
  await setConfig('live_match_state', JSON.stringify(state))
}

// ── Main logic ────────────────────────────────────────────────────────────
async function checkAndNotify() {
  const match = await fetchLiveMatch()

  if (!match) {
    // ESPN returned no Ceuta match — could be an API hiccup during a live game.
    // Don't delete stored state here; only clear it after the match reaches 'post'.
    // If we cleared on every miss we'd reset the goal baseline mid-game.
    const prev = await getStoredState()
    if (prev?.state === 'post') {
      await deleteConfig('live_match_state')
    }
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

  const rival = match.homeTeam.toLowerCase().includes('ceuta') ? match.awayTeam : match.homeTeam
  const ceutaIsHome = match.homeTeam.toLowerCase().includes('ceuta')
  const score = `${match.homeScore}-${match.awayScore}`

  // ── Match just started ────────────────────────────────────────────────
  // Only fire kickoff on the pre→in transition; skip if we already stored 'in'
  // (avoids duplicate notifications after ESPN temporarily drops the match)
  if ((!prev || prev.state === 'pre') && match.state === 'in') {
    await sendPush(
      '⚽ ¡Ya estamos en marcha, caballas!',
      `Hoy nos enfrentamos al ${rival}. 90 minutos de lucha. ¡Vamos Ceuta! 🖤⚪`,
      'kickoff'
    )
    notifications.push('kickoff')
  }

  // ── Goal detected ─────────────────────────────────────────────────────
  if (prev && match.state === 'in') {
    const homeGoals = match.homeScore - prev.homeScore
    const awayGoals = match.awayScore - prev.awayScore

    for (let i = 0; i < homeGoals; i++) {
      const ceutaScored = ceutaIsHome
      const scorer = match.events.filter((e) => e.type === 'goal' && e.team === 'home').pop()

      if (ceutaScored) {
        await sendPush(
          `🚨 ¡¡GOOOOOL DE CEUTA!! 🔥`,
          `¡${scorer?.playerName ?? 'GOOOL'}! ¡Qué locura! Marcador: ${score} (${scorer?.minute ?? ''}) ¡VAMOS CABALLAS! 🖤⚪`,
          `goal-home-${match.homeScore}`
        )
      } else {
        await sendPush(
          `😤 Gol en contra... (${score})`,
          `Nos han marcado${scorer ? ` ${scorer.playerName}` : ''}. Pero esto no ha terminado. ¡A por ellos! 💪`,
          `goal-home-${match.homeScore}`
        )
      }
      notifications.push(`goal-home-${match.homeScore}`)
    }

    for (let i = 0; i < awayGoals; i++) {
      const ceutaScored = !ceutaIsHome
      const scorer = match.events.filter((e) => e.type === 'goal' && e.team === 'away').pop()

      if (ceutaScored) {
        await sendPush(
          `🚨 ¡¡GOOOOOL DE CEUTA!! 🔥`,
          `¡${scorer?.playerName ?? 'GOOOL'}! ¡Qué locura! Marcador: ${score} (${scorer?.minute ?? ''}) ¡VAMOS CABALLAS! 🖤⚪`,
          `goal-away-${match.awayScore}`
        )
      } else {
        await sendPush(
          `😤 Gol en contra... (${score})`,
          `Nos han marcado${scorer ? ` ${scorer.playerName}` : ''}. Pero esto no ha terminado. ¡A por ellos! 💪`,
          `goal-away-${match.awayScore}`
        )
      }
      notifications.push(`goal-away-${match.awayScore}`)
    }

    // ── Red card ────────────────────────────────────────────────────────
    const newEvents = match.events.slice(prev.eventCount)
    const redCards = newEvents.filter((e) => e.type === 'redCard')
    for (const card of redCards) {
      const isCeuta = card.team === (ceutaIsHome ? 'home' : 'away')
      if (isCeuta) {
        await sendPush(
          `🟥 Nos quedamos con 10...`,
          `Roja para ${card.playerName} en el ${card.minute}. Ahora más unidos que nunca. ¡El Ceuta no se rinde! 🖤⚪`,
          `red-${card.minute}`
        )
      } else {
        await sendPush(
          `🟥 ¡Roja para el rival!`,
          `Expulsado ${card.playerName} (${card.minute}). ¡Con uno más, a aprovechar! Vamos Ceuta 💪🔥`,
          `red-${card.minute}`
        )
      }
      notifications.push(`red-${card.playerName}`)
    }
  }

  // ── Match finished ────────────────────────────────────────────────────
  if (prev?.state === 'in' && match.state === 'post') {
    const ceutaScore = ceutaIsHome ? match.homeScore : match.awayScore
    const rivalScore = ceutaIsHome ? match.awayScore : match.homeScore

    if (ceutaScore > rivalScore) {
      await sendPush(
        `🏆 ¡¡VICTORIA CABALLAS!! (${score})`,
        `¡Lo hemos conseguido! Tres puntos de oro. Gracias por estar siempre con nosotros. ¡Hasta la siguiente! 🖤⚪🔥`,
        'fulltime'
      )
    } else if (ceutaScore < rivalScore) {
      await sendPush(
        `😔 Derrota... pero seguimos juntos (${score})`,
        `No era el día. Esto es el fútbol. Pero el Ceuta siempre se levanta. ¡Gracias por el apoyo! 🖤⚪`,
        'fulltime'
      )
    } else {
      await sendPush(
        `🤝 Empate final (${score})`,
        `Un punto que suma. El equipo lo ha dado todo. ¡Gracias caballas por el apoyo! 🖤⚪`,
        'fulltime'
      )
    }
    notifications.push('fulltime')
  }

  await saveState(newState)
  return {
    match: { state: match.state, score: `${match.homeScore}-${match.awayScore}` },
    notifications,
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
    .verify({
      signature: request.headers.get('Upstash-Signature') ?? '',
      body,
    })
    .catch(() => false)

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
