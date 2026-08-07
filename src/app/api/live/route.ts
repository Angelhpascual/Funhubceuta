import { NextResponse } from 'next/server'
import { ESPN_SCOREBOARD, ESPN_SUMMARY } from '@/lib/constants'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { getConfig, setConfig, deleteConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { supabase } from '@/infrastructure/supabase/client'
import type { LiveEvent, LiveMatch, LineupPlayer, MatchStat } from '@/domain/match/LiveMatch'

const matchesRepo = new MatchesSupabaseRepository()

async function getSquadPhotoMap(): Promise<Map<string, string>> {
  const { data } = await supabase
    .from('squad')
    .select('name, photo_url')
    .not('photo_url', 'is', null)
  const map = new Map<string, string>()
  for (const p of data ?? []) {
    if (p.name && p.photo_url) map.set(p.name.toLowerCase(), p.photo_url)
  }
  return map
}

function matchPhotoUrl(playerName: string, photoMap: Map<string, string>): string | null {
  const lower = playerName.toLowerCase()
  if (photoMap.has(lower)) return photoMap.get(lower)!
  // partial match — last name or first word
  for (const [name, url] of photoMap) {
    const parts = name.split(' ')
    if (parts.some(p => p.length > 3 && lower.includes(p))) return url
  }
  return null
}

export type { LiveEvent, LiveMatch }

// Cache 60s — multiple users share the same ESPN response
export const revalidate = 0

async function fetchEspn(url: string) {
  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  }, 15_000)
  if (!res.ok) return null
  return res.json()
}

// Preview/local: never cache (you're testing, mock changes instantly)
// Production: 20s edge cache — all users share one Supabase/ESPN fetch
const NO_CACHE = { headers: { 'Cache-Control': 'no-store' } }
const EDGE_CACHE = { headers: { 'Cache-Control': 's-maxage=20, stale-while-revalidate=10' } }

function cacheHeaders() {
  return process.env.VERCEL_ENV === 'production' ? EDGE_CACHE : NO_CACHE
}

export async function GET() {
  // Use mock in local dev and Vercel preview — never in production
  if (process.env.VERCEL_ENV !== 'production') {
    const mock = await getConfig('live_match_mock')
    if (mock) return NextResponse.json({ match: JSON.parse(mock) }, NO_CACHE)
    // No active mock — check if there's a recent result (last 3 days) to show
    const lastResult = await getConfig('live_last_result')
    if (lastResult) {
      try {
        const r = JSON.parse(lastResult)
        const savedAt = new Date(r.savedAt ?? 0)
        const ageDays = (Date.now() - savedAt.getTime()) / 86_400_000
        if (ageDays < 3) return NextResponse.json({ match: { ...r, state: 'post' } }, NO_CACHE)
        await deleteConfig('live_last_result') // auto-expire after 3 days
      } catch { /* ignore */ }
    }
    return NextResponse.json({ match: null }, NO_CACHE)
  }

  // Serve from Supabase cache if fresh (< 55s) — avoids hitting ESPN on every user request
  const cachedRaw = await getConfig('live_espn_cache')
  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw)
      const ageMs = Date.now() - new Date(cached._cachedAt ?? 0).getTime()
      if (ageMs < 55_000) {
        const { _cachedAt: _, ...match } = cached
        return NextResponse.json({ match: match ?? null }, cacheHeaders())
      }
    } catch { /* stale/corrupt cache — fall through to ESPN */ }
  }

  const scoreboard = await fetchEspn(ESPN_SCOREBOARD)
  if (!scoreboard) {
    const lastResult = await getConfig('live_last_result')
    if (lastResult) {
      try {
        const r = JSON.parse(lastResult)
        const ageDays = (Date.now() - new Date(r.savedAt ?? 0).getTime()) / 86_400_000
        if (ageDays < 3) return NextResponse.json({ match: { ...r, state: 'post' } }, cacheHeaders())
        await deleteConfig('live_last_result')
      } catch { /* ignore */ }
    }
    return NextResponse.json({ match: null }, cacheHeaders())
  }

  const events: unknown[] = scoreboard.events ?? []

  // Find Ceuta match
  const ceutaEvent = events.find((e: unknown) => {
    const ev = e as Record<string, unknown>
    return JSON.stringify(ev).toLowerCase().includes('ceuta')
  }) as Record<string, unknown> | undefined

  if (!ceutaEvent) {
    const lastResult = await getConfig('live_last_result')
    if (lastResult) {
      try {
        const r = JSON.parse(lastResult)
        const ageDays = (Date.now() - new Date(r.savedAt ?? 0).getTime()) / 86_400_000
        if (ageDays < 3) return NextResponse.json({ match: { ...r, state: 'post' } }, cacheHeaders())
        await deleteConfig('live_last_result')
      } catch { /* ignore */ }
    }
    return NextResponse.json({ match: null }, cacheHeaders())
  }

  const competition = (ceutaEvent.competitions as Record<string, unknown>[])?.[0]
  if (!competition) return NextResponse.json({ match: null }, cacheHeaders())

  const status = competition.status as Record<string, unknown>
  const statusType = status?.type as Record<string, unknown>
  const competitors = competition.competitors as Record<string, unknown>[]

  const home = competitors?.find(
    (c) => (c as Record<string, unknown>).homeAway === 'home'
  ) as Record<string, unknown>
  const away = competitors?.find(
    (c) => (c as Record<string, unknown>).homeAway === 'away'
  ) as Record<string, unknown>
  const homeTeamData = home?.team as Record<string, unknown>
  const awayTeamData = away?.team as Record<string, unknown>
  const venue = competition.venue as Record<string, unknown>

  const state = statusType?.state as string
  const clockDisplay = (status?.displayClock as string) ?? ''
  const statusDesc = statusType?.description as string

  // Guard: cross-check with DB match date. ESPN occasionally seeds upcoming fixtures
  // with corrupt state ('in', clock '1''). A match can only be live if the DB says
  // it's within a ±4h window of its real kickoff time.
  let guardedState = state
  if (state === 'in') {
    const espnId = String(ceutaEvent.id ?? '')
    const dbMatch = await matchesRepo.fetchByEspnId(espnId)
    if (dbMatch?.date) {
      const kickoff = new Date(dbMatch.date)
      const now = new Date()
      const diffHours = (now.getTime() - kickoff.getTime()) / 3_600_000
      // Only trust 'in' state if kickoff was between 0 and 4 hours ago
      if (diffHours < 0 || diffHours > 4) guardedState = 'pre'
    }
  }

  // Fetch play-by-play events + lineup during/after match (or pre for lineup)
  let liveEvents: LiveEvent[] = []
  let homeLineup: LineupPlayer[] | undefined
  let awayLineup: LineupPlayer[] | undefined
  let stats: MatchStat[] | undefined

  if (guardedState === 'pre' || guardedState === 'in' || guardedState === 'post') {
    const summary = await fetchEspn(`${ESPN_SUMMARY}?event=${ceutaEvent.id}`)

    // Extract lineups from rosters
    const rosters: unknown[] = summary?.rosters ?? []
    for (const r of rosters) {
      const roster = r as Record<string, unknown>
      const teamId = (roster.team as Record<string, unknown>)?.id
      const players = ((roster.roster as unknown[]) ?? []).map((p: unknown) => {
        const player = p as Record<string, unknown>
        const athlete = player.athlete as Record<string, unknown>
        return {
          name: (athlete?.displayName as string) ?? '',
          jersey: (athlete?.jersey as string) ?? '',
          position: ((player.position as Record<string, unknown>)?.abbreviation as string) ?? '',
          starter: Boolean(player.starter),
        } satisfies LineupPlayer
      }).filter((p) => p.name)
      if (teamId === homeTeamData?.id) homeLineup = players
      else awayLineup = players
    }

    // Extract boxscore stats: possession, shots on target, corners, pass accuracy
    const STAT_KEYS = ['possessionPct', 'shotsOnTarget', 'wonCorners', 'passPct'] as const
    const STAT_LABELS: Record<string, string> = {
      possessionPct: 'Posesión',
      shotsOnTarget: 'Tiros a puerta',
      wonCorners: 'Córners',
      passPct: 'Precisión pases',
    }
    const boxTeams: unknown[] = summary?.boxscore?.teams ?? []
    if (boxTeams.length === 2) {
      const getTeamStats = (t: unknown) => {
        const team = t as Record<string, unknown>
        const arr = (team.statistics as Record<string, unknown>[]) ?? []
        const map: Record<string, string> = {}
        for (const s of arr) map[s.name as string] = String(s.displayValue ?? '')
        return { map, isHome: team.homeAway === 'home' }
      }
      const t0 = getTeamStats(boxTeams[0])
      const t1 = getTeamStats(boxTeams[1])
      const homeStats = t0.isHome ? t0.map : t1.map
      const awayStats = t0.isHome ? t1.map : t0.map
      stats = STAT_KEYS.map((key) => ({
        name: key,
        displayName: STAT_LABELS[key],
        home: homeStats[key] ?? '0',
        away: awayStats[key] ?? '0',
      })).filter(s => s.home !== '0' || s.away !== '0')
      if (stats.length === 0) stats = undefined
    }

    if (guardedState !== 'pre') {
      const plays: unknown[] = summary?.plays ?? []
      liveEvents = plays
      .filter((p: unknown) => {
        const play = p as Record<string, unknown>
        const type = (((play.type as Record<string, unknown>)?.text as string) ?? '').toLowerCase()
        return type.includes('goal') || type.includes('yellow') || type.includes('red')
      })
      .map((p: unknown) => {
        const play = p as Record<string, unknown>
        const typeText = (
          ((play.type as Record<string, unknown>)?.text as string) ?? ''
        ).toLowerCase()
        const clock = play.clock as Record<string, unknown>
        const participants = (play.participants as Record<string, unknown>[]) ?? []
        const athlete = participants[0]?.athlete as Record<string, unknown>

        let type: LiveEvent['type'] = 'goal'
        if (typeText.includes('yellow')) type = 'yellowCard'
        else if (typeText.includes('red')) type = 'redCard'
        else if (typeText.includes('substitution')) type = 'substitution'

        const playTeamId = (play.team as Record<string, unknown>)?.id
        const team: 'home' | 'away' = playTeamId === homeTeamData?.id ? 'home' : 'away'

        return {
          type,
          minute: (clock?.displayValue as string) ?? '',
          team,
          playerName: (athlete?.displayName as string) ?? '',
        }
      })
    } // end if guardedState !== 'pre'
  } // end if pre|in|post

  // Enrich goal events of Ceuta players with photo from squad
  if (liveEvents.length > 0) {
    const photoMap = await getSquadPhotoMap()
    const homeIsCeuta = (homeTeamData?.displayName as string ?? '').toLowerCase().includes('ceuta')
    const ceutaTeam: 'home' | 'away' = homeIsCeuta ? 'home' : 'away'
    liveEvents = liveEvents.map(ev => {
      if (ev.type === 'goal' && ev.team === ceutaTeam && ev.playerName) {
        const photoUrl = matchPhotoUrl(ev.playerName, photoMap)
        if (photoUrl) return { ...ev, photoUrl }
      }
      return ev
    })
  }

  // Don't show a finished match that ended more than 3 hours ago
  if (guardedState === 'post') {
    const matchDate = new Date(ceutaEvent.date as string)
    const hoursSinceMatch = (Date.now() - matchDate.getTime()) / 3_600_000
    if (hoursSinceMatch > 3) return NextResponse.json({ match: null })

    // If ESPN didn't return events, try to get them from stored state
    if (liveEvents.length === 0) {
      const storedRaw = await getConfig('live_match_state')
      if (storedRaw) {
        try {
          const storedState = JSON.parse(storedRaw)
          if (storedState.espnId === ceutaEvent.id && storedState.events?.length) {
            liveEvents = storedState.events
          }
        } catch {
          /* ignore */
        }
      }
    }
  }

  // Build match after post-branch may have updated liveEvents from stored state
  const match: LiveMatch = {
    espnId: ceutaEvent.id as string,
    state: (guardedState as 'pre' | 'in' | 'post') ?? 'pre',
    status: statusDesc ?? '',
    clock: guardedState === 'in' ? clockDisplay || '' : '',
    homeTeam: (homeTeamData?.displayName as string) ?? '',
    awayTeam: (awayTeamData?.displayName as string) ?? '',
    homeScore: parseInt((home?.score as string) ?? '0'),
    awayScore: parseInt((away?.score as string) ?? '0'),
    events: liveEvents,
    venue: ((venue as Record<string, unknown>)?.fullName as string) ?? '',
    startDate: (ceutaEvent.date as string) ?? '',
    homeLineup: homeLineup?.length ? homeLineup : undefined,
    awayLineup: awayLineup?.length ? awayLineup : undefined,
    stats,
  }

  // Write enriched result to Supabase cache so next requests skip ESPN
  void setConfig('live_espn_cache', JSON.stringify({ ...match, _cachedAt: new Date().toISOString() }))

  return NextResponse.json({ match }, cacheHeaders())
}
