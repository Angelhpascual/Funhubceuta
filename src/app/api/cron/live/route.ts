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
import { stopLiveSchedule } from '@/infrastructure/live/stopLiveSchedule'
import { enqueueLiveTick } from '@/infrastructure/live/enqueueLiveTick'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'

const matchesRepo = new MatchesSupabaseRepository()

// Safety net: a match plus stoppage time never needs live mode for this long.
// If the normal 'post' transition is ever missed (ESPN never reports 'post',
// the stored baseline is lost, ...) the per-minute QStash schedule would
// otherwise keep running forever.
const LIVE_MAX_DURATION_MS = 2.5 * 3_600_000

// ── Fetch live match from ESPN (shared parsing with /api/live) ────────────

// `eventsOk` is false when ESPN's /summary could not be read: the event list is
// then empty only because it is unknown, not because nothing happened.
type FetchedMatch = LiveMatch & { eventsOk: boolean }

async function fetchLiveMatch(): Promise<FetchedMatch | null> {
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
  let eventsOk = true
  if (state === 'in' || state === 'post') {
    try {
      const sum = await fetchWithTimeout(`${ESPN}/summary?event=${event.id}`, { cache: 'no-store' }, 15_000)
      if (sum.ok) {
        events = parseLiveEvents(await sum.json(), core.homeTeamId)
      } else {
        eventsOk = false
      }
    } catch {
      eventsOk = false
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
    eventsOk,
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
  // Dedupe keys of pushes already sent for this match, persisted right after
  // each send so a QStash retry of the same tick can't send them twice.
  notified?: string[]
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
async function checkAndNotify(testMode = false, bodyChain?: string) {
  // Guard: only run when live mode is explicitly active
  if (!testMode) {
    const liveActive = await getConfig('live_active')
    if (liveActive !== 'true') {
      return { match: null, notifications: [], skipped: true }
    }

    // A newer chain (watchdog restart) supersedes this one: drop the tick and
    // do not queue another, so two chains can never run side by side.
    const currentChain = await getConfig('live_chain_id')
    if (bodyChain && currentChain && bodyChain !== currentChain) {
      return { match: null, notifications: [], skipped: true, staleChain: true as const }
    }

    const activatedAtRaw = await getConfig('live_activated_at')
    if (!activatedAtRaw) {
      // Activated before the guard existed: start counting from now.
      await setConfig('live_activated_at', new Date().toISOString())
    } else {
      const age = Date.now() - new Date(activatedAtRaw).getTime()
      if (Number.isFinite(age) && age > LIVE_MAX_DURATION_MS) {
        await stopLiveSchedule()
        await deleteConfig('live_match_state')
        await notifyAdmin(
          '⚠️ Modo directo apagado por seguridad',
          'Llevaba más de 2 horas y media activo sin detectar el final del partido. Revisa el resultado.'
        ).catch((err) => logCron('live', 'error', 0, { stage: 'notifyAdmin', error: String(err) }))
        return { match: null, notifications: [], skipped: true, stoppedBy: 'max-duration' as const }
      }
    }
  }
  const match = await fetchLiveMatch()

  if (!match) {
    // ESPN returned no Ceuta match — could be an API hiccup during a live game.
    // Don't delete stored state here; only clear it after the match reaches 'post'.
    // If we cleared on every miss we'd reset the goal baseline mid-game.
    const stored = await getStoredState()
    if (stored?.state === 'post') {
      await deleteConfig('live_match_state')
    }
    return { match: null, notifications: [], keepAlive: true }
  }

  // Baseline only counts if it belongs to THIS match: a leftover 'post' state
  // from the previous fixture must not suppress this one's kickoff push or
  // skew its goal diff.
  const stored = await getStoredState()
  const prev = stored && stored.espnId === match.espnId ? stored : null
  const notifications: string[] = []

  const newState: MatchState = {
    espnId: match.espnId,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    state: match.state,
    // Unreadable /summary → keep the old count instead of resetting it to 0,
    // which would re-attribute old goals to the wrong scorer next tick.
    eventCount: match.eventsOk ? match.events.length : (prev?.eventCount ?? 0),
  }

  const notified = new Set<string>(prev?.notified ?? [])
  // A disallowed (VAR) goal lowers the score: forget the dedupe keys of goals
  // that no longer stand, so the same goal being scored again notifies again.
  if (prev) {
    for (let n = match.homeScore + 1; n <= prev.homeScore; n++) notified.delete(`goal-home-${n}`)
    for (let n = match.awayScore + 1; n <= prev.awayScore; n++) notified.delete(`goal-away-${n}`)
  }
  async function pushOnce(key: string, m: { title: string; body: string }, tag: string) {
    if (notified.has(key)) return
    await sendPush(m.title, m.body, tag, '/partidos', testMode)
    notified.add(key)
    notifications.push(tag)
    // Persist the dedupe set immediately. With no previous baseline the first
    // tick stores the current state; otherwise keep the old baseline so the
    // goal diff is still computed correctly if this tick is retried.
    await saveState({ ...(prev ?? newState), notified: [...notified] })
  }

  const rival = match.homeTeam.toLowerCase().includes('ceuta') ? match.awayTeam : match.homeTeam
  const ceutaIsHome = match.homeTeam.toLowerCase().includes('ceuta')
  const score = `${match.homeScore}-${match.awayScore}`

  // ── Match just started ────────────────────────────────────────────────
  if ((!prev || prev.state === 'pre') && match.state === 'in') {
    const m = MSG.kickoff(rival)
    await pushOnce('kickoff', m, 'kickoff')
  }

  // ── Goal detected ─────────────────────────────────────────────────────
  if (prev && match.state === 'in') {
    const homeGoals = match.homeScore - prev.homeScore
    const awayGoals = match.awayScore - prev.awayScore

    // When two goals from the same team land in a single poll window, each
    // needs its OWN scorer and its own running score. Using the last goal of
    // the whole match (the old `.pop()`) attributed every notification in the
    // batch to the same player, and tagging them with the final score made the
    // tags collide, so platforms that dedupe pushes by tag swallowed one.
    const newGoalEvents = match.events.slice(prev.eventCount).filter((e) => e.type === 'goal')
    const newHomeGoalEvents = newGoalEvents.filter((e) => e.team === 'home')
    const newAwayGoalEvents = newGoalEvents.filter((e) => e.team === 'away')

    for (let i = 0; i < homeGoals; i++) {
      const ceutaScored = ceutaIsHome
      const scorer = newHomeGoalEvents[i] ?? newHomeGoalEvents[newHomeGoalEvents.length - 1]
      const scoreAfter = `${prev.homeScore + i + 1}-${match.awayScore}`
      const tag = `goal-home-${prev.homeScore + i + 1}`
      const m = ceutaScored
        ? MSG.goalCeuta(scorer?.playerName ?? 'GOOOL', scoreAfter, scorer?.minute ?? '')
        : MSG.goalRival(scorer?.playerName ?? '', scoreAfter)
      await pushOnce(tag, m, tag)
    }

    for (let i = 0; i < awayGoals; i++) {
      const ceutaScored = !ceutaIsHome
      const scorer = newAwayGoalEvents[i] ?? newAwayGoalEvents[newAwayGoalEvents.length - 1]
      const scoreAfter = `${match.homeScore}-${prev.awayScore + i + 1}`
      const tag = `goal-away-${prev.awayScore + i + 1}`
      const m = ceutaScored
        ? MSG.goalCeuta(scorer?.playerName ?? 'GOOOL', scoreAfter, scorer?.minute ?? '')
        : MSG.goalRival(scorer?.playerName ?? '', scoreAfter)
      await pushOnce(tag, m, tag)
    }

    // ── Red card ────────────────────────────────────────────────────────
    const newEvents = match.events.slice(prev.eventCount)
    const redCards = newEvents.filter((e) => e.type === 'redCard')
    for (const card of redCards) {
      const isCeuta = card.team === (ceutaIsHome ? 'home' : 'away')
      const m = isCeuta
        ? MSG.redCeuta(card.playerName, card.minute)
        : MSG.redRival(card.playerName, card.minute)
      await pushOnce(`red:${card.playerName}:${card.minute}`, m, `red-${card.minute}`)
    }
  }

  // ── Match finished — final-result push, then auto-deactivate live mode ──
  // Triggered by ESPN reporting 'post', whether or not we saw the match 'in'
  // beforehand (restart, lost baseline, missed poll): the final result must
  // always go out and the live mode must always shut down. The push goes first
  // so that if it throws, live stays on and QStash's retry sends it again;
  // pushOnce makes that retry safe.
  if (match.state === 'post') {
    const ceutaScore = ceutaIsHome ? match.homeScore : match.awayScore
    const rivalScore = ceutaIsHome ? match.awayScore : match.homeScore
    const result = ceutaScore > rivalScore ? 'W' : ceutaScore < rivalScore ? 'L' : 'D'
    const m =
      result === 'W' ? MSG.winCeuta(score) : result === 'L' ? MSG.lossCeuta(score) : MSG.drawCeuta(score)
    await pushOnce('fulltime', m, 'fulltime')
    // Clear the live flags (and any legacy schedule); no next tick is queued.
    // Test mode (?test=true) only ever sends the push: it must not switch off
    // real live mode or mark the match finished.
    if (!testMode) {
      await stopLiveSchedule()
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
  }

  await saveState({ ...newState, notified: [...notified] })
  return {
    match: { state: match.state, score: `${match.homeScore}-${match.awayScore}` },
    notifications,
    keepAlive: match.state !== 'post',
  }
}

async function enqueueNextTick(chain: string | undefined) {
  try {
    await enqueueLiveTick(60, chain)
  } catch (err) {
    await logCron('live', 'error', 0, { stage: 'enqueueNextTick', error: String(err) })
    await notifyAdmin(
      '⚠️ El directo no pudo programar el siguiente minuto',
      'Revisa QStash: sin el siguiente aviso, el partido dejará de actualizarse.'
    ).catch(() => {})
  }
}

const ERROR_STREAK_KEY = 'live_error_streak'
const ERROR_STREAK_ALERT_AT = 3

// `canChain` is false for a manual POST without a chain id (admin "sync now",
// a message queued before this version): it runs once but must not queue a
// follow-up, or it would start a second chain carrying the live chain's id.
async function checkAndNotifySafe(testMode = false, bodyChain?: string, canChain = true) {
  const t0 = Date.now()
  try {
    const result = await checkAndNotify(testMode, bodyChain)
    // Self-chaining: queue the next tick while the match is still on. When the
    // match ends (or the safety guard fires) keepAlive is false, so the chain
    // simply stops — nothing left running to switch off.
    if (!testMode && canChain && result.keepAlive) {
      await enqueueNextTick(bodyChain ?? (await getConfig('live_chain_id')) ?? undefined)
    }
    if (!testMode && canChain && !('staleChain' in result)) {
      await getConfig(ERROR_STREAK_KEY).then((v) => (v ? deleteConfig(ERROR_STREAK_KEY) : undefined)).catch(() => {})
    }
    await logCron('live', 'success', Date.now() - t0, {
      match: result.match,
      notifications: result.notifications,
      testMode: testMode || undefined,
      staleChain: 'staleChain' in result ? true : undefined,
    })
    return result
  } catch (err) {
    await logCron('live', 'error', Date.now() - t0, { error: String(err) })
    // ESPN timeouts, a bad payload, a failed push... must not break the chain:
    // while live mode is still on, queue the next minute and answer 200 so
    // QStash does not burn retries on an already-superseded tick.
    if (!testMode) {
      let stillActive = false
      try {
        stillActive = (await getConfig('live_active')) === 'true'
      } catch { /* fall through to rethrow */ }
      if (stillActive && canChain) {
        // A failure that never clears would otherwise retry silently for the
        // whole window: tell the admin once, on the third consecutive error.
        try {
          const streak = Number((await getConfig(ERROR_STREAK_KEY)) ?? 0) + 1
          await setConfig(ERROR_STREAK_KEY, String(streak))
          if (streak === ERROR_STREAK_ALERT_AT) {
            await notifyAdmin(
              '⚠️ El directo falla en cada minuto',
              'Lleva 3 errores seguidos leyendo el partido. Revisa cron_logs (tipo live).'
            ).catch(() => {})
          }
        } catch { /* alerting is best effort */ }
        await enqueueNextTick(bodyChain ?? (await getConfig('live_chain_id').catch(() => null)) ?? undefined)
        return { match: null, notifications: [] as string[], error: String(err), keepAlive: true }
      }
    }
    throw err
  }
}

// ── Routes ────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const testMode = searchParams.get('test') === 'true'

  // verifyCronRequest reads the body to check QStash's signature, which
  // consumes it: take a copy first or the chain id would always be lost.
  const bodyCopy = request.clone()
  if (!(await verifyCronRequest(request))) return cronUnauthorized()

  const body = await bodyCopy.json().catch(() => ({}))
  const chain = typeof body?.chain === 'string' ? body.chain : undefined
  const result = await checkAndNotifySafe(testMode, chain, chain !== undefined)
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
