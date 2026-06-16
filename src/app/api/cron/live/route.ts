import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import webpush from 'web-push'
import type { LiveMatch, LiveEvent } from '@/app/api/live/route'
import { setConfig, deleteConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import { ESPN_BASE as ESPN } from '@/lib/constants'
import { MSG } from './messages'

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

// ── Message variants ─────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const MSG = {
  kickoff: (rival: string) =>
    pick([
      {
        title: '⚽ ¡Arranca el partido, caballas!',
        body: `AD Ceuta vs ${rival}. 90 minutos de corazón blanquinegro. ¡Vamos! 🖤⚪`,
      },
      {
        title: '🔴 ¡Ya rueda el balón!',
        body: `Ceuta frente al ${rival}. El Murube late. ¡Esto empieza! 🖤⚪🔥`,
      },
      {
        title: '⚽ ¡En marcha, caballas!',
        body: `Hoy toca pelear contra el ${rival}. ¡La afición empuja desde casa! 🖤⚪`,
      },
      {
        title: '🏟️ ¡Comienza el partido!',
        body: `AD Ceuta sale al campo ante el ${rival}. ¡Dalo todo, Ceuta! 💪🖤⚪`,
      },
    ]),

  goalCeuta: (scorer: string, score: string, minute: string) =>
    pick([
      {
        title: '🚨 ¡¡GOOOOOL DE CEUTA!! 🔥',
        body: `¡${scorer}! ¡Qué locura! Marcador: ${score} (${minute}) ¡VAMOS CABALLAS! 🖤⚪`,
      },
      {
        title: '⚽🖤⚪ ¡GOL DEL CEUTA!',
        body: `¡Marca ${scorer}! ${score} — ¡La ciudad entera explota! 🔥🔥🔥`,
      },
      {
        title: '🔴 ¡¡GOOOL!! ¡${scorer} mete el ${score}!',
        body: `Min ${minute} — ¡Arriba los Caballas! Esto sí que es fútbol 🖤⚪💥`,
      },
      {
        title: '💥 ¡GOLAZO BLANQUINEGRO!',
        body: `${scorer} no perdona. ${score} en el ${minute}. ¡El Murube revienta! 🖤⚪🔥`,
      },
    ]),

  goalRival: (scorer: string, score: string) =>
    pick([
      {
        title: `😤 Gol en contra... (${score})`,
        body: `Nos han marcado${scorer ? ` ${scorer}` : ''}. Pero esto no ha terminado. ¡A por ellos! 💪`,
      },
      {
        title: `😠 ${score} — Gol del rival`,
        body: `${scorer ? `${scorer} nos adelanta` : 'Gol en contra'}. ¡Queda partido, caballas! 🖤⚪`,
      },
      {
        title: `⚠️ Gol en contra (${score})`,
        body: `Golpe, pero no es el final. El Ceuta se crecerá. ¡Ánimo! 🖤⚪💪`,
      },
      {
        title: `😤 Nos marcan... (${score})`,
        body: `${scorer ? `${scorer} anota` : 'Gol rival'}. El Ceuta no se rinde nunca. ¡A remontarlo! 🔥`,
      },
    ]),

  redCeuta: (player: string, minute: string) =>
    pick([
      {
        title: '🟥 Nos quedamos con 10...',
        body: `Roja para ${player} en el ${minute}. Ahora más unidos que nunca. ¡El Ceuta no se rinde! 🖤⚪`,
      },
      {
        title: `🟥 Expulsado ${player} (${minute})`,
        body: `Con 10, pero con más corazón que nunca. ¡Vamos Ceuta! 🖤⚪💪`,
      },
      {
        title: '🟥 Roja en el Ceuta...',
        body: `${player} se va al vestuario en el ${minute}. 10 guerreros quedan en el campo. ¡A defenderlo! 🖤⚪`,
      },
    ]),

  redRival: (player: string, minute: string) =>
    pick([
      {
        title: '🟥 ¡Roja para el rival!',
        body: `Expulsado ${player} (${minute}). ¡Con uno más, a aprovechar! Vamos Ceuta 💪🔥`,
      },
      {
        title: `🟥 ¡Se queda con 10 el rival!`,
        body: `${player} ve la roja en el ${minute}. ¡Momento de atacar, caballas! 🖤⚪🔥`,
      },
      {
        title: '🟥 ¡Superioridad numérica!',
        body: `Fuera ${player} (${minute}). ¡Ahora hay que aprovechar! ¡Vamos Ceuta! 💥🖤⚪`,
      },
    ]),

  winCeuta: (score: string) =>
    pick([
      {
        title: `🏆 ¡¡VICTORIA CABALLAS!! (${score})`,
        body: `¡Lo hemos conseguido! Tres puntos de oro. ¡Gracias por estar siempre con nosotros! 🖤⚪🔥`,
      },
      {
        title: `🏆 ¡Tres puntos! (${score})`,
        body: `¡Partido fantástico! El Ceuta gana y sigue adelante. ¡Arriba los caballas! 🖤⚪💪`,
      },
      {
        title: `⚽ ¡Ganamoooos! (${score})`,
        body: `¡Qué tarde tan grande! Tres puntos que saben a gloria. ¡Hasta la siguiente, caballas! 🔥🖤⚪`,
      },
      {
        title: `🖤⚪ ¡Victoria del Ceuta! (${score})`,
        body: `¡Enorme trabajo del equipo! Puntos en el bolsillo. ¡La ciudad está de fiesta! 🎉`,
      },
    ]),

  lossCeuta: (score: string) =>
    pick([
      {
        title: `😔 Derrota... pero seguimos juntos (${score})`,
        body: `No era el día. Esto es el fútbol. El Ceuta siempre se levanta. ¡Gracias por el apoyo! 🖤⚪`,
      },
      {
        title: `😞 No pudo ser (${score})`,
        body: `Derrota dura, pero el equipo lo ha intentado. ¡Seguimos, caballas! 🖤⚪💪`,
      },
      {
        title: `⚫ Derrota (${score})`,
        body: `Un mal resultado que olvidar. El Ceuta se levantará. ¡La afición siempre está ahí! 🖤⚪`,
      },
    ]),

  drawCeuta: (score: string) =>
    pick([
      {
        title: `🤝 Empate final (${score})`,
        body: `Un punto que suma. El equipo lo ha dado todo. ¡Gracias caballas! 🖤⚪`,
      },
      {
        title: `➖ Tablas (${score})`,
        body: `Se reparte el botín. El Ceuta no se rindió. ¡Un punto es un punto! 🖤⚪`,
      },
      {
        title: `🤝 Empate justo (${score})`,
        body: `Ni para unos ni para otros. El Ceuta peleó hasta el final. ¡Gracias afición! 🖤⚪`,
      },
    ]),

  matchDay: (rival: string, time: string | null, isHome: boolean) =>
    pick([
      {
        title: '📅 ¡Hoy jugamos, caballas!',
        body: `AD Ceuta vs ${rival}${time ? ` a las ${time}` : ''}. ${isHome ? '🏠 En casa' : '✈️ Fuera'}. ¡A por los tres puntos! 🖤⚪`,
      },
      {
        title: '⚽ ¡Día de partido!',
        body: `Hoy frente al ${rival}${time ? ` (${time})` : ''}. ${isHome ? 'El Murube estará con vosotros' : 'Vamos a por ello fuera de casa'}. ¡Vamos Ceuta! 🖤⚪🔥`,
      },
      {
        title: `🖤⚪ Esta tarde, Ceuta vs ${rival}`,
        body: `${time ? `Arranca a las ${time}. ` : ''}${isHome ? '¡El Murube como fortín!' : '¡A ganar lejos de casa!'} ¡Ánimo caballas! 💪`,
      },
      {
        title: '🏟️ ¡Jornada de fútbol!',
        body: `AD Ceuta se mide al ${rival}${time ? ` a las ${time}` : ''}. ¡La ciudad entera apoya! 🖤⚪`,
      },
    ]),
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
  if ((!prev || prev.state === 'pre') && match.state === 'in') {
    const m = MSG.kickoff(rival)
    await sendPush(m.title, m.body, 'kickoff')
    notifications.push('kickoff')
  }

  // ── Goal detected ─────────────────────────────────────────────────────
  if (prev && match.state === 'in') {
    const homeGoals = match.homeScore - prev.homeScore
    const awayGoals = match.awayScore - prev.awayScore

    for (let i = 0; i < homeGoals; i++) {
      const ceutaScored = ceutaIsHome
      const scorer = match.events.filter((e) => e.type === 'goal' && e.team === 'home').pop()
      const m = ceutaScored
        ? MSG.goalCeuta(scorer?.playerName ?? 'GOOOL', score, scorer?.minute ?? '')
        : MSG.goalRival(scorer?.playerName ?? '', score)
      await sendPush(m.title, m.body, `goal-home-${match.homeScore}`)
      notifications.push(`goal-home-${match.homeScore}`)
    }

    for (let i = 0; i < awayGoals; i++) {
      const ceutaScored = !ceutaIsHome
      const scorer = match.events.filter((e) => e.type === 'goal' && e.team === 'away').pop()
      const m = ceutaScored
        ? MSG.goalCeuta(scorer?.playerName ?? 'GOOOL', score, scorer?.minute ?? '')
        : MSG.goalRival(scorer?.playerName ?? '', score)
      await sendPush(m.title, m.body, `goal-away-${match.awayScore}`)
      notifications.push(`goal-away-${match.awayScore}`)
    }

    // ── Red card ────────────────────────────────────────────────────────
    const newEvents = match.events.slice(prev.eventCount)
    const redCards = newEvents.filter((e) => e.type === 'redCard')
    for (const card of redCards) {
      const isCeuta = card.team === (ceutaIsHome ? 'home' : 'away')
      const m = isCeuta
        ? MSG.redCeuta(card.playerName, card.minute)
        : MSG.redRival(card.playerName, card.minute)
      await sendPush(m.title, m.body, `red-${card.minute}`)
      notifications.push(`red-${card.playerName}`)
    }
  }

  // ── Match finished ────────────────────────────────────────────────────
  if (prev?.state === 'in' && match.state === 'post') {
    const ceutaScore = ceutaIsHome ? match.homeScore : match.awayScore
    const rivalScore = ceutaIsHome ? match.awayScore : match.homeScore
    const m =
      ceutaScore > rivalScore
        ? MSG.winCeuta(score)
        : ceutaScore < rivalScore
          ? MSG.lossCeuta(score)
          : MSG.drawCeuta(score)
    await sendPush(m.title, m.body, 'fulltime')
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
