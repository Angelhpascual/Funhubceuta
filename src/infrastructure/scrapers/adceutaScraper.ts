import { ESPN_BASE as ESPN, ESPN_CEUTA_ID as CEUTA_ID } from '@/lib/constants'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'

export type { ScrapedMatch, ScrapedResult } from '@/domain/match/ScrapedMatch'
import type { ScrapedMatch, ScrapedResult } from '@/domain/match/ScrapedMatch'

const WEEKDAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function parseScore(raw: unknown): number {
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') return parseInt(raw) || 0
  if (raw && typeof raw === 'object') {
    const v =
      (raw as Record<string, unknown>).displayValue ?? (raw as Record<string, unknown>).value
    return typeof v === 'string' ? parseInt(v) || 0 : Number(v) || 0
  }
  return 0
}

function hasUpcomingMatch(events: Record<string, unknown>[]): boolean {
  return events.some((e) => {
    const comp = (e.competitions as Record<string, unknown>[])?.[0]
    const state = (comp?.status as Record<string, unknown>)?.type as Record<string, unknown>
    return (state?.state as string) === 'pre'
  })
}

async function fetchSchedule(): Promise<Record<string, unknown>[]> {
  // Try team endpoint first (faster, scoped) — but ESPN sometimes only backfills
  // past fixtures here for a while after each matchday, omitting upcoming ones.
  // Only trust it if it actually contains an unplayed match; otherwise fall
  // through to the full-season scoreboard scan below.
  const teamRes = await fetchWithTimeout(`${ESPN}/teams/${CEUTA_ID}/schedule`, { next: { revalidate: 0 } }, 15_000)
  if (teamRes.ok) {
    const data = await teamRes.json()
    const events = (data.events ?? []) as Record<string, unknown>[]
    if (events.length > 0 && hasUpcomingMatch(events)) return events
  }

  // Fallback: full scoreboard filtered to Ceuta (covers seasons where ESPN team endpoint lags)
  const scoreRes = await fetchWithTimeout(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/esp.2/scoreboard?dates=20260801-20270630&limit=500`,
    { next: { revalidate: 0 } },
    15_000
  )
  if (!scoreRes.ok) return []
  const scoreData = await scoreRes.json()
  const all = (scoreData.events ?? []) as Record<string, unknown>[]
  return all.filter((e) => {
    const comps = (e.competitions as Record<string, unknown>[])?.[0]
    const competitors = (comps?.competitors ?? []) as Record<string, unknown>[]
    return competitors.some((c) => (c.team as Record<string, unknown>)?.id === CEUTA_ID)
  })
}

// ESPN has twice this session sent a corrupt event for this team/competition
// (a 'post' state 6 minutes before real kickoff, and a mock-shaped payload
// during testing) — a malformed `competitors` array (missing a 'home' or
// 'away' entry) is the same class of bad data. Without this check, a single
// bad event threw inside `.map()` and silently failed the *entire* sync for
// that cron run (every other, perfectly good upcoming fixture/result along
// with it), recovering only on the next scheduled run.
function hasHomeAndAway(e: Record<string, unknown>): boolean {
  const comp = (e.competitions as Record<string, unknown>[] | undefined)?.[0]
  const competitors = (comp?.competitors ?? []) as Record<string, unknown>[]
  return (
    competitors.some((c) => c.homeAway === 'home') &&
    competitors.some((c) => c.homeAway === 'away')
  )
}

function mapEventToMatch(e: Record<string, unknown>): ScrapedMatch {
  const comp = (e.competitions as Record<string, unknown>[])[0]
  const competitors = comp.competitors as Record<string, unknown>[]
  const home = competitors.find((c) => c.homeAway === 'home')!
  const away = competitors.find((c) => c.homeAway === 'away')!
  const dateStr = (e.date as string).slice(0, 10)
  const dateObj = new Date(e.date as string)
  return {
    homeTeam: (home.team as Record<string, unknown>).displayName as string,
    awayTeam: (away.team as Record<string, unknown>).displayName as string,
    date: dateStr,
    time: dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }),
    weekday: WEEKDAYS_ES[dateObj.getDay()],
    isHome: ((home.team as Record<string, unknown>).id as string) === CEUTA_ID,
    ticketsUrl: null,
    espnEventId: String(e.id ?? ''),
  }
}

export async function scrapeAllScheduled(): Promise<ScrapedMatch[]> {
  const events = await fetchSchedule()
  return events
    .filter((e) => {
      const comp = (e.competitions as Record<string, unknown>[])?.[0]
      const state = (comp?.status as Record<string, unknown>)?.type as Record<string, unknown>
      return (state?.state as string) === 'pre'
    })
    .filter(hasHomeAndAway)
    .map(mapEventToMatch)
}

export async function scrapeNextMatches(): Promise<ScrapedMatch[]> {
  const events = await fetchSchedule()
  const today = new Date().toISOString().split('T')[0]

  return events
    .filter((e) => {
      const comp = (e.competitions as Record<string, unknown>[])?.[0]
      const state = (comp?.status as Record<string, unknown>)?.type as Record<string, unknown>
      return (state?.state as string) === 'pre' && (e.date as string)?.slice(0, 10) >= today
    })
    .filter(hasHomeAndAway)
    .slice(0, 10)
    .map(mapEventToMatch)
}

export async function scrapeNextMatch(): Promise<ScrapedMatch | null> {
  const all = await scrapeNextMatches()
  return all[0] ?? null
}

export async function scrapeRecentResults(limit = 10): Promise<ScrapedResult[]> {
  const events = await fetchSchedule()

  return events
    .filter((e) => {
      const comp = (e.competitions as Record<string, unknown>[])?.[0]
      const state = (comp?.status as Record<string, unknown>)?.type as Record<string, unknown>
      return (state?.state as string) === 'post'
    })
    .filter(hasHomeAndAway)
    .slice(-limit)
    .reverse()
    .map((e) => {
      const comp = (e.competitions as Record<string, unknown>[])[0]
      const competitors = comp.competitors as Record<string, unknown>[]
      const home = competitors.find((c) => c.homeAway === 'home')!
      const away = competitors.find((c) => c.homeAway === 'away')!
      const homeScore = parseScore(home.score)
      const awayScore = parseScore(away.score)
      const isHome = ((home.team as Record<string, unknown>).id as string) === CEUTA_ID
      const ceutaGoals = isHome ? homeScore : awayScore
      const oppGoals = isHome ? awayScore : homeScore
      const result: 'W' | 'D' | 'L' =
        ceutaGoals > oppGoals ? 'W' : ceutaGoals === oppGoals ? 'D' : 'L'
      const dateStr = (e.date as string).slice(0, 10)
      const dateObj = new Date(e.date as string)
      return {
        homeTeam: (home.team as Record<string, unknown>).displayName as string,
        awayTeam: (away.team as Record<string, unknown>).displayName as string,
        homeScore,
        awayScore,
        date: dateStr,
        weekday: WEEKDAYS_ES[dateObj.getDay()],
        result,
        isHome,
        espnEventId: String(e.id ?? ''),
      }
    })
}

export async function scrapeRecentForm(): Promise<string[]> {
  const results = await scrapeRecentResults(5)
  return results.map((r) => r.result)
}
