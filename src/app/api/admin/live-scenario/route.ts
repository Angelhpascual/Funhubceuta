/**
 * Simulador de partido en directo — para testing en local y preview
 *
 * Pasos:
 *   GET /api/admin/live-scenario?step=kickoff&secret=X   → partido empieza
 *   GET /api/admin/live-scenario?step=goal1&secret=X     → ¡GOL DEL CEUTA! 1-0
 *   GET /api/admin/live-scenario?step=goal2&secret=X     → GOL RIVAL 1-1
 *   GET /api/admin/live-scenario?step=redcard&secret=X   → TARJETA ROJA rival
 *   GET /api/admin/live-scenario?step=halftime&secret=X  → Descanso 1-1
 *   GET /api/admin/live-scenario?step=goal3&secret=X     → ¡GOL DEL CEUTA! 2-1
 *   GET /api/admin/live-scenario?step=fulltime&secret=X  → FINAL 2-1 ¡VICTORIA!
 *   GET /api/admin/live-scenario?step=reset&secret=X     → Limpia estado
 *   GET /api/admin/live-scenario?step=push&secret=X      → Push de prueba
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { sendPushDev } from '@/infrastructure/push/sendPush'
import { withApi } from '@/lib/apiError'

const HOME = 'FC Andorra'
const AWAY = 'Ceuta'

const STEPS: Record<
  string,
  {
    state: 'pre' | 'in' | 'post'
    homeScore: number
    awayScore: number
    clock: string
    events: { type: string; minute: string; team: string; playerName: string }[]
    label: string
  }
> = {
  kickoff: {
    state: 'in',
    homeScore: 0,
    awayScore: 0,
    clock: "1'",
    events: [],
    label: '⚽ Partido comenzado — min 1',
  },
  goal1: {
    state: 'in',
    homeScore: 0,
    awayScore: 1,
    clock: "23'",
    events: [{ type: 'goal', minute: "23'", team: 'away', playerName: 'Bassinga' }],
    label: "🚨 GOL DEL CEUTA! 0-1 · Bassinga 23'",
  },
  goal2: {
    state: 'in',
    homeScore: 1,
    awayScore: 1,
    clock: "38'",
    events: [
      { type: 'goal', minute: "23'", team: 'away', playerName: 'Bassinga' },
      { type: 'goal', minute: "38'", team: 'home', playerName: 'Riera' },
    ],
    label: "⚽ Gol rival. Empate 1-1 · Riera 38'",
  },
  redcard: {
    state: 'in',
    homeScore: 1,
    awayScore: 1,
    clock: "42'",
    events: [
      { type: 'goal', minute: "23'", team: 'away', playerName: 'Bassinga' },
      { type: 'goal', minute: "38'", team: 'home', playerName: 'Riera' },
      { type: 'redCard', minute: "42'", team: 'home', playerName: 'Lainez' },
    ],
    label: "🟥 Tarjeta roja rival — Lainez 42'",
  },
  halftime: {
    state: 'in',
    homeScore: 1,
    awayScore: 1,
    clock: 'HT',
    events: [
      { type: 'goal', minute: "23'", team: 'away', playerName: 'Bassinga' },
      { type: 'goal', minute: "38'", team: 'home', playerName: 'Riera' },
      { type: 'redCard', minute: "42'", team: 'home', playerName: 'Lainez' },
    ],
    label: '⏸ Descanso — 1-1',
  },
  goal3: {
    state: 'in',
    homeScore: 1,
    awayScore: 2,
    clock: "67'",
    events: [
      { type: 'goal', minute: "23'", team: 'away', playerName: 'Bassinga' },
      { type: 'goal', minute: "38'", team: 'home', playerName: 'Riera' },
      { type: 'redCard', minute: "42'", team: 'home', playerName: 'Lainez' },
      { type: 'goal', minute: "67'", team: 'away', playerName: 'Zalazar' },
    ],
    label: "🚨 GOL DEL CEUTA! 1-2 · Zalazar 67'",
  },
  fulltime: {
    state: 'post',
    homeScore: 1,
    awayScore: 2,
    clock: '',
    events: [
      { type: 'goal', minute: "23'", team: 'away', playerName: 'Bassinga' },
      { type: 'goal', minute: "38'", team: 'home', playerName: 'Riera' },
      { type: 'redCard', minute: "42'", team: 'home', playerName: 'Lainez' },
      { type: 'goal', minute: "67'", team: 'away', playerName: 'Zalazar' },
    ],
    label: '⏱ FINAL — FC Andorra 1-2 Ceuta ¡VICTORIA!',
  },
}

export const GET = withApi(async (request: NextRequest) => {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const step = request.nextUrl.searchParams.get('step') ?? 'kickoff'

  if (step === 'reset') {
    await supabaseAdmin.from('app_config').delete().eq('key', 'live_match_state')
    await supabaseAdmin.from('app_config').delete().eq('key', 'live_match_mock')
    return NextResponse.json({ ok: true, message: 'Estado limpiado' })
  }

  if (step === 'push') {
    const { sent } = await sendPushDev({
      title: '🧪 Prueba de notificación',
      body: 'Las alertas del Ceuta funcionan ✅',
      tag: 'test',
    })
    return NextResponse.json({ ok: true, sent, message: `Push enviado a ${sent} dispositivos` })
  }

  const data = STEPS[step]
  if (!data) {
    return NextResponse.json(
      { error: `Step desconocido. Usa: ${Object.keys(STEPS).join(', ')}` },
      { status: 400 }
    )
  }

  const score = `${data.homeScore}-${data.awayScore}`

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

  await supabaseAdmin.from('app_config').upsert(
    { key: 'live_match_mock', value: JSON.stringify(mockMatch), updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )

  const { data: prevData } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'live_match_state')
    .single()
  const prev = prevData?.value ? JSON.parse(prevData.value) : null

  const notifications: string[] = []

  if (!prev && data.state === 'in') {
    const { sent } = await sendPushDev({
      title: '⚽ ¡Ya estamos en marcha, caballas!',
      body: `Hoy nos enfrentamos al ${HOME}. 90 minutos de lucha. ¡Vamos Ceuta! 🖤⚪`,
      tag: 'kickoff',
    })
    notifications.push(`kickoff (${sent} enviados)`)
  }

  if (prev && data.state === 'in') {
    const awayCeutaGoals = data.awayScore - (prev.awayScore ?? 0)
    const homeRivalGoals = data.homeScore - (prev.homeScore ?? 0)

    for (let i = 0; i < awayCeutaGoals; i++) {
      const scorer = data.events.filter((e) => e.type === 'goal' && e.team === 'away').pop()
      const { sent } = await sendPushDev({
        title: '🚨 ¡¡GOOOOOL DE CEUTA!! 🔥',
        body: `¡${scorer?.playerName ?? 'GOOOL'}! ¡Qué locura! Marcador: ${score} (${scorer?.minute ?? ''}) ¡VAMOS CABALLAS! 🖤⚪`,
        tag: `goal-${data.awayScore}`,
      })
      notifications.push(`goal-ceuta (${sent} enviados)`)
    }

    for (let i = 0; i < homeRivalGoals; i++) {
      const scorer = data.events.filter((e) => e.type === 'goal' && e.team === 'home').pop()
      const { sent } = await sendPushDev({
        title: `😤 Gol en contra... (${score})`,
        body: `Nos han marcado${scorer ? ` ${scorer.playerName}` : ''}. Pero esto no ha terminado. ¡A por ellos! 💪`,
        tag: `goal-rival-${data.homeScore}`,
      })
      notifications.push(`goal-rival (${sent} enviados)`)
    }

    const prevRedCards = (prev.events ?? []).filter(
      (e: { type: string }) => e.type === 'redCard'
    ).length
    const newRedCards = data.events.filter((e) => e.type === 'redCard').slice(prevRedCards)
    for (const card of newRedCards) {
      const isCeuta = card.team === 'away'
      const { sent } = await sendPushDev(
        isCeuta
          ? { title: '🟥 Nos quedamos con 10...', body: `Roja para ${card.playerName} en el ${card.minute}. ¡El Ceuta no se rinde! 🖤⚪`, tag: `red-${card.minute}` }
          : { title: '🟥 ¡Roja para el rival!', body: `Expulsado ${card.playerName} (${card.minute}). ¡Con uno más, a aprovechar! 💪🔥`, tag: `red-${card.minute}` }
      )
      notifications.push(`redcard (${sent} enviados)`)
    }
  }

  if (prev?.state === 'in' && data.state === 'post') {
    const ceutaWins = data.awayScore > data.homeScore
    const draw = data.awayScore === data.homeScore
    const { sent } = await sendPushDev(
      ceutaWins
        ? { title: `🏆 ¡¡VICTORIA CABALLAS!! (${score})`, body: '¡Lo hemos conseguido! Tres puntos de oro. ¡Hasta la siguiente! 🖤⚪🔥', tag: 'fulltime' }
        : draw
        ? { title: `🤝 Empate final (${score})`, body: 'Un punto que suma. El equipo lo ha dado todo. ¡Gracias caballas! 🖤⚪', tag: 'fulltime' }
        : { title: `😔 Derrota... pero seguimos juntos (${score})`, body: 'No era el día. Pero el Ceuta siempre se levanta. ¡Gracias por el apoyo! 🖤⚪', tag: 'fulltime' }
    )
    notifications.push(`fulltime (${sent} enviados)`)
  }

  await supabaseAdmin.from('app_config').upsert(
    {
      key: 'live_match_state',
      value: JSON.stringify({
        espnId: 'test',
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        state: data.state,
        events: data.events,
      }),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  )

  return NextResponse.json({ ok: true, step, label: data.label, score, state: data.state, notifications })
})
