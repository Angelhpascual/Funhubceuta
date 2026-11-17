import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest, cronUnauthorized } from '@/infrastructure/cron/auth'
import type { LiveMatch } from '@/domain/match/LiveMatch'
import { getConfig, setConfig, deleteConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { sendPush as sendPushProd, sendPushAdminOnly } from '@/infrastructure/push/sendPush'
import { ESPN_BASE as ESPN } from '@/lib/constants'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { findCeutaEvent, parseMatchCore, guardMatchState, parseLiveEvents } from '@/infrastructure/espn/parseLiveMatch'
import { madridDateTimeToUtc } from '@/lib/madridTime'
import { MSG } from './messages'
import { logCron } from '@/infrastructure/supabase/logCron'
import { notifyAdmin } from '@/infrastructure/push/notifyAdmin'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'

const matchesRepo = new MatchesSupabaseRepository()

// ── Fetch live match from ESPN (shared parsing with /api/live) ────────────

async function fetchLiveMatch(): Promise<LiveMatch | null> {
  const res = await fetchWithTimeout(`${ESPN}/scoreboard`, { cache: 'no-store' }, 15_000)
  if (!res.ok) return null

  const sb = await res.json()
  const event = findCeutaEvent(sb)
  if (!event) return null

  const core = parseMatchCore(event)
  if (!core) return null

  // Same corrupt-state guard /api/live applies: ESPN can briefly seed an
  // upcoming fixture as 'in' or 'post' before real kickoff. Needs the actual
  // kickoff instant, not just the DB's midnight `date` — a date-only guard
  // can never flag a corrupt state seeded *on* match day, which is exactly
  // when it happens (regression: this is what let the Castellón-Ceuta corrupt
  // 'post' slip through even after the guardMatchState fix landed).
  const dbMatch = await matchesRepo.fetchByEspnId(core.espnId)
  const kickoffIso = dbMatch ? madridDateTimeToUtc(String(dbMatch.date).slice(0, 10), dbMatch.time).toISOString() : null
  const state = guardMatchState(core.state, kickoffIso)

  let events: LiveMatch['events'] = []
  if (state === 'in' || state === 'post') {
    const sum = await fetchWithTimeout(`${ESPN}/summary?event=${event.id}`, { cache: 'no-store' }, 15_000)
    if (sum.ok) {
      events = parseLiveEvents(await sum.json(), core.homeTeamId)
    }
  }

  return {
    espnId: core.espnId,
    state,
    status: core.status,
    clock: state === 'in' ? core.clock : '',
    homeTeam: core.homeTeam,
    awayTeam: core.awayTeam,
    homeScore: core.homeScore,
    awayScore: core.awayScore,
    events,
    venue: core.venue,
    startDate: core.startDate,
  }
}

// ── Send push to all subscribers, or admin-only in test mode ──────────────
// Real (non-test) sends go through sendPush(), which refuses to send at all
// unless VERCEL_ENV === 'production' — the same guard every other push in
// the app respects. Test-mode sends are already gated by TEST_SECRET and
// only ever reach admin-marked subscriptions, so they're allowed to bypass
// that guard (sendPushAdminOnly), which is the point of testing them.
async function sendPush(title: string, body: string, tag: string, url = '/partidos', testMode = false) {
  const payload = { title, body, tag, url }
  const result = testMode ? await sendPushAdminOnly(payload) : await sendPushProd(payload)
  return result.sent
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
async function checkAndNotify(testMode = false) {
  // Guard: only run when live mode is explicitly active
  if (!testMode) {
    const liveActive = await getConfig('live_active')
    if (liveActive !== 'true') {
      return { match: null, notifications: [], skipped: true }
    }
  }
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
    await sendPush(m.title, m.body, 'kickoff', '/partidos', testMode)
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
      await sendPush(m.title, m.body, `goal-home-${match.homeScore}`, '/partidos', testMode)
      notifications.push(`goal-home-${match.homeScore}`)
    }

    for (let i = 0; i < awayGoals; i++) {
      const ceutaScored = !ceutaIsHome
      const scorer = match.events.filter((e) => e.type === 'goal' && e.team === 'away').pop()
      const m = ceutaScored
        ? MSG.goalCeuta(scorer?.playerName ?? 'GOOOL', score, scorer?.minute ?? '')
        : MSG.goalRival(scorer?.playerName ?? '', score)
      await sendPush(m.title, m.body, `goal-away-${match.awayScore}`, '/partidos', testMode)
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
      await sendPush(m.title, m.body, `red-${card.minute}`, '/partidos', testMode)
      notifications.push(`red-${card.playerName}`)
    }
  }

  // ── Match finished — auto-deactivate live mode ────────────────────────
  if (prev?.state === 'in' && match.state === 'post') {
    // Stop the QStash schedule automatically
    const scheduleId = await getConfig('live_qstash_schedule_id')
    if (scheduleId) {
      try {
        const { Client } = await import('@upstash/qstash')
        const client = new Client({ token: process.env.QSTASH_TOKEN! })
        await client.schedules.delete(scheduleId)
      } catch { /* best effort */ }
      await deleteConfig('live_qstash_schedule_id')
    }
    await setConfig('live_active', 'false')
    const ceutaScore = ceutaIsHome ? match.homeScore : match.awayScore
    const rivalScore = ceutaIsHome ? match.awayScore : match.homeScore
    const result = ceutaScore > rivalScore ? 'W' : ceutaScore < rivalScore ? 'L' : 'D'
    const m =
      result === 'W' ? MSG.winCeuta(score) : result === 'L' ? MSG.lossCeuta(score) : MSG.drawCeuta(score)
    await sendPush(m.title, m.body, 'fulltime', '/partidos', testMode)
    notifications.push('fulltime')
    await notifyAdmin('🏁 Partido terminado', 'Abre la votación MVP cuando tengas los candidatos').catch((err) =>
      logCron('live', 'error', 0, { stage: 'notifyAdmin', error: String(err) })
    )
    // Reflejar el resultado en la tabla de partidos de inmediato — si no, el
    // partido sigue apareciendo como "programado" hasta el próximo cron
    // semanal de resultados (puede tardar días).
    await matchesRepo.markMatchFinished(match.espnId, match.homeScore, match.awayScore, result).catch((err) =>
      logCron('live', 'error', 0, { stage: 'markMatchFinished', error: String(err) })
    )
  }

  await saveState(newState)
  return {
    match: { state: match.state, score: `${match.homeScore}-${match.awayScore}` },
    notifications,
  }
}

async function checkAndNotifySafe(testMode = false) {
  const t0 = Date.now()
  try {
    const result = await checkAndNotify(testMode)
    await logCron('live', 'success', Date.now() - t0, {
      match: result.match,
      notifications: result.notifications,
      testMode: testMode || undefined,
    })
    return result
  } catch (err) {
    await logCron('live', 'error', Date.now() - t0, { error: String(err) })
    throw err
  }
}

// ── Routes ────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const testMode = searchParams.get('test') === 'true'

  if (!(await verifyCronRequest(request))) return cronUnauthorized()

  const result = await checkAndNotifySafe(testMode)
  return NextResponse.json({ ok: true, testMode: testMode || undefined, ...result })
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST in production' }, { status: 405 })
  }
  const { searchParams } = new URL(request.url)
  const testMode = searchParams.get('test') === 'true'
  const result = await checkAndNotifySafe(testMode)
  return NextResponse.json({ ok: true, testMode: testMode || undefined, ...result })
}
