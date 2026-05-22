/**
 * Simulador de partido en directo — SOLO EN LOCAL (dev)
 *
 * Pasos del simulacro:
 *   GET /api/test/simulate?step=kickoff   → partido empieza
 *   GET /api/test/simulate?step=goal1     → ¡GOL DEL CEUTA! 1-0
 *   GET /api/test/simulate?step=goal2     → GOL RIVAL 1-1
 *   GET /api/test/simulate?step=redcard   → TARJETA ROJA rival
 *   GET /api/test/simulate?step=halftime  → Descanso 1-1
 *   GET /api/test/simulate?step=goal3     → ¡GOL DEL CEUTA! 2-1
 *   GET /api/test/simulate?step=fulltime  → FINAL 2-1 ¡VICTORIA!
 *   GET /api/test/simulate?step=reset     → Limpia estado
 *   GET /api/test/simulate?step=push      → Envía push de prueba directo
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/infrastructure/supabase/client'
import webpush from 'web-push'

if (process.env.NODE_ENV !== 'production') {
  webpush.setVapidDetails(
    'mailto:angelhpascual@gmail.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

const HOME = 'FC Andorra'
const AWAY = 'Ceuta'

const STEPS: Record<string, {
  state: 'pre' | 'in' | 'post'
  homeScore: number
  awayScore: number
  clock: string
  events: { type: string; minute: string; team: string; playerName: string }[]
  label: string
}> = {
  kickoff: {
    state: 'in', homeScore: 0, awayScore: 0, clock: "1'",
    events: [],
    label: '⚽ Partido comenzado — min 1',
  },
  goal1: {
    state: 'in', homeScore: 0, awayScore: 1, clock: "23'",
    events: [{ type: 'goal', minute: "23'", team: 'away', playerName: 'Bassinga' }],
    label: '🚨 GOL DEL CEUTA! 0-1 · Bassinga 23\'',
  },
  goal2: {
    state: 'in', homeScore: 1, awayScore: 1, clock: "38'",
    events: [
      { type: 'goal', minute: "23'", team: 'away', playerName: 'Bassinga' },
      { type: 'goal', minute: "38'", team: 'home', playerName: 'Riera' },
    ],
    label: '⚽ Gol rival. Empate 1-1 · Riera 38\'',
  },
  redcard: {
    state: 'in', homeScore: 1, awayScore: 1, clock: "42'",
    events: [
      { type: 'goal', minute: "23'", team: 'away', playerName: 'Bassinga' },
      { type: 'goal', minute: "38'", team: 'home', playerName: 'Riera' },
      { type: 'redCard', minute: "42'", team: 'home', playerName: 'Lainez' },
    ],
    label: '🟥 Tarjeta roja rival — Lainez 42\'',
  },
  halftime: {
    state: 'in', homeScore: 1, awayScore: 1, clock: 'HT',
    events: [
      { type: 'goal', minute: "23'", team: 'away', playerName: 'Bassinga' },
      { type: 'goal', minute: "38'", team: 'home', playerName: 'Riera' },
      { type: 'redCard', minute: "42'", team: 'home', playerName: 'Lainez' },
    ],
    label: '⏸ Descanso — 1-1',
  },
  goal3: {
    state: 'in', homeScore: 1, awayScore: 2, clock: "67'",
    events: [
      { type: 'goal', minute: "23'", team: 'away', playerName: 'Bassinga' },
      { type: 'goal', minute: "38'", team: 'home', playerName: 'Riera' },
      { type: 'redCard', minute: "42'", team: 'home', playerName: 'Lainez' },
      { type: 'goal', minute: "67'", team: 'away', playerName: 'Zalazar' },
    ],
    label: '🚨 GOL DEL CEUTA! 1-2 · Zalazar 67\'',
  },
  fulltime: {
    state: 'post', homeScore: 1, awayScore: 2, clock: '',
    events: [
      { type: 'goal', minute: "23'", team: 'away', playerName: 'Bassinga' },
      { type: 'goal', minute: "38'", team: 'home', playerName: 'Riera' },
      { type: 'redCard', minute: "42'", team: 'home', playerName: 'Lainez' },
      { type: 'goal', minute: "67'", team: 'away', playerName: 'Zalazar' },
    ],
    label: '⏱ FINAL — FC Andorra 1-2 Ceuta ¡VICTORIA!',
  },
}

async function sendPushAll(title: string, body: string, tag: string) {
  const { data: subs } = await supabase.from('push_subscriptions').select('endpoint, p256dh, auth')
  if (!subs?.length) return 0
  let sent = 0
  await Promise.allSettled(subs.map(async sub => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, tag, url: '/' })
      )
      sent++
    } catch {}
  }))
  return sent
}

export async function GET(request: NextRequest) {
  // Allow in production only with secret param
  const secret = request.nextUrl.searchParams.get('secret')
  if (process.env.NODE_ENV === 'production' && secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const step = request.nextUrl.searchParams.get('step') ?? 'kickoff'

  // Reset — limpia el estado guardado
  if (step === 'reset') {
    await supabase.from('app_config').delete().eq('key', 'live_match_state')
    await supabase.from('app_config').delete().eq('key', 'live_match_mock')
    return NextResponse.json({ ok: true, message: 'Estado limpiado' })
  }

  // Push de prueba directo
  if (step === 'push') {
    const sent = await sendPushAll('🧪 Prueba de notificación', 'Las alertas del Ceuta funcionan ✅', 'test')
    return NextResponse.json({ ok: true, sent, message: `Push enviado a ${sent} dispositivos` })
  }

  const data = STEPS[step]
  if (!data) {
    return NextResponse.json({ error: `Step desconocido. Usa: ${Object.keys(STEPS).join(', ')}` }, { status: 400 })
  }

  // Guarda el mock como estado actual del partido
  const mockMatch = {
    espnId: 'test-748973',
    state: data.state,
    status: data.state === 'in' ? '1st Half' : data.state === 'post' ? 'Full Time' : 'Scheduled',
    clock: data.clock,
    homeTeam: HOME,
    awayTeam: AWAY,
    homeScore: data.homeScore,
    awayScore: data.awayScore,
    events: data.events,
    venue: 'Estadio de la FAF (Encamp)',
    startDate: new Date().toISOString(),
  }

  await supabase.from('app_config').upsert(
    { key: 'live_match_mock', value: JSON.stringify(mockMatch), updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )

  // Lee el estado anterior y compara para enviar notificaciones
  const { data: prevData } = await supabase.from('app_config').select('value').eq('key', 'live_match_state').single()
  const prev = prevData?.value ? JSON.parse(prevData.value) : null

  const notifications: string[] = []

  const score = `${data.homeScore}-${data.awayScore}`
  const rival = HOME // Ceuta is away

  if (!prev && data.state === 'in') {
    const sent = await sendPushAll(
      '⚽ ¡Ya estamos en marcha, caballas!',
      `Hoy nos enfrentamos al ${rival}. 90 minutos de lucha. ¡Vamos Ceuta! 🖤⚪`,
      'kickoff'
    )
    notifications.push(`kickoff (${sent} enviados)`)
  }

  if (prev && data.state === 'in') {
    const awayCeutaGoals = data.awayScore - (prev.awayScore ?? 0)
    const homeRivalGoals = data.homeScore - (prev.homeScore ?? 0)

    for (let i = 0; i < awayCeutaGoals; i++) {
      const scorer = data.events.filter(e => e.type === 'goal' && e.team === 'away').pop()
      const sent = await sendPushAll(
        `🚨 ¡¡GOOOOOL DE CEUTA!! 🔥`,
        `¡${scorer?.playerName ?? 'GOOOL'}! ¡Qué locura! Marcador: ${score} (${scorer?.minute ?? ''}) ¡VAMOS CABALLAS! 🖤⚪`,
        `goal-${data.awayScore}`
      )
      notifications.push(`goal-ceuta (${sent} enviados)`)
    }

    for (let i = 0; i < homeRivalGoals; i++) {
      const scorer = data.events.filter(e => e.type === 'goal' && e.team === 'home').pop()
      const sent = await sendPushAll(
        `😤 Gol en contra... (${score})`,
        `Nos han marcado${scorer ? ` ${scorer.playerName}` : ''}. Pero esto no ha terminado. ¡A por ellos! 💪`,
        `goal-rival-${data.homeScore}`
      )
      notifications.push(`goal-rival (${sent} enviados)`)
    }

    const prevRedCards = (prev.events ?? []).filter((e: { type: string }) => e.type === 'redCard').length
    const newRedCards = data.events.filter(e => e.type === 'redCard').slice(prevRedCards)
    for (const card of newRedCards) {
      const isCeuta = card.team === 'away'
      const sent = isCeuta
        ? await sendPushAll(
            `🟥 Nos quedamos con 10...`,
            `Roja para ${card.playerName} en el ${card.minute}. Ahora más unidos que nunca. ¡El Ceuta no se rinde! 🖤⚪`,
            `red-${card.minute}`
          )
        : await sendPushAll(
            `🟥 ¡Roja para el rival!`,
            `Expulsado ${card.playerName} (${card.minute}). ¡Con uno más, a aprovechar! Vamos Ceuta 💪🔥`,
            `red-${card.minute}`
          )
      notifications.push(`redcard (${sent} enviados)`)
    }
  }

  if (prev?.state === 'in' && data.state === 'post') {
    const ceutaWins = data.awayScore > data.homeScore
    const draw = data.awayScore === data.homeScore
    let title, body
    if (ceutaWins) {
      title = `🏆 ¡¡VICTORIA CABALLAS!! (${score})`
      body = `¡Lo hemos conseguido! Tres puntos de oro. Gracias por estar siempre con nosotros. ¡Hasta la siguiente! 🖤⚪🔥`
    } else if (draw) {
      title = `🤝 Empate final (${score})`
      body = `Un punto que suma. El equipo lo ha dado todo. ¡Gracias caballas por el apoyo! 🖤⚪`
    } else {
      title = `😔 Derrota... pero seguimos juntos (${score})`
      body = `No era el día. Esto es el fútbol. Pero el Ceuta siempre se levanta. ¡Gracias por el apoyo! 🖤⚪`
    }
    const sent = await sendPushAll(title, body, 'fulltime'
    )
    notifications.push(`fulltime (${sent} enviados)`)
  }

  // Actualiza estado
  await supabase.from('app_config').upsert(
    { key: 'live_match_state', value: JSON.stringify({ espnId: 'test', homeScore: data.homeScore, awayScore: data.awayScore, state: data.state, eventCount: data.events.length, events: data.events }), updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )

  return NextResponse.json({ ok: true, step, label: data.label, score: `${data.homeScore}-${data.awayScore}`, state: data.state, notifications })
}
