import type { LiveEvent } from '@/domain/match/LiveMatch'

// Shared between /api/live (page data, with lineups/stats/caching on top)
// and /api/cron/live (push-notification trigger) — both used to carry their
// own near-identical copy of this parsing, which could silently drift apart.

export interface EspnMatchCore {
  espnId: string
  state: 'pre' | 'in' | 'post'
  status: string
  clock: string
  homeTeamId: string
  awayTeamId: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  venue: string
  startDate: string
}

// ESPN's scoreboard lists every match of the division — find the one
// involving Ceuta. There's no team-id filter on this endpoint, so matching
// on "ceuta" appearing anywhere in the serialized event is what both
// original copies did; kept as-is rather than risk missing a shape ESPN
// doesn't document.
export function findCeutaEvent(scoreboard: unknown): Record<string, unknown> | null {
  const events = ((scoreboard as Record<string, unknown> | null)?.events as unknown[]) ?? []
  const found = events.find((e) => JSON.stringify(e).toLowerCase().includes('ceuta'))
  return (found as Record<string, unknown> | undefined) ?? null
}

export function parseMatchCore(ceutaEvent: Record<string, unknown>): EspnMatchCore | null {
  const competition = (ceutaEvent.competitions as Record<string, unknown>[] | undefined)?.[0]
  if (!competition) return null

  const status = competition.status as Record<string, unknown> | undefined
  const statusType = status?.type as Record<string, unknown> | undefined
  const competitors = competition.competitors as Record<string, unknown>[] | undefined
  const home = competitors?.find((c) => c.homeAway === 'home')
  const away = competitors?.find((c) => c.homeAway === 'away')
  const homeTeamData = home?.team as Record<string, unknown> | undefined
  const awayTeamData = away?.team as Record<string, unknown> | undefined
  const venue = competition.venue as Record<string, unknown> | undefined

  return {
    espnId: String(ceutaEvent.id ?? ''),
    state: ((statusType?.state as string) ?? 'pre') as 'pre' | 'in' | 'post',
    status: (statusType?.description as string) ?? '',
    clock: (status?.displayClock as string) ?? '',
    homeTeamId: String(homeTeamData?.id ?? ''),
    awayTeamId: String(awayTeamData?.id ?? ''),
    homeTeam: (homeTeamData?.displayName as string) ?? '',
    awayTeam: (awayTeamData?.displayName as string) ?? '',
    homeScore: parseInt((home?.score as string) ?? '0'),
    awayScore: parseInt((away?.score as string) ?? '0'),
    venue: (venue?.fullName as string) ?? '',
    startDate: (ceutaEvent.date as string) ?? '',
  }
}

// ESPN occasionally seeds an upcoming fixture with a corrupt 'in' state
// before kickoff. A match can only really be live if, per our own DB, its
// kickoff was between 0 and 4 hours ago — otherwise treat it as still 'pre'.
export function guardMatchState(
  state: 'pre' | 'in' | 'post',
  kickoffIso: string | null | undefined
): 'pre' | 'in' | 'post' {
  if (state !== 'in' || !kickoffIso) return state
  const diffHours = (Date.now() - new Date(kickoffIso).getTime()) / 3_600_000
  return diffHours < 0 || diffHours > 4 ? 'pre' : 'in'
}

// Goal/card events from ESPN's play-by-play. Substitutions are intentionally
// excluded — neither original caller surfaced them (the LiveEvent type
// allows 'substitution', but it was never reachable past this filter).
export function parseLiveEvents(summary: unknown, homeTeamId: string): LiveEvent[] {
  const plays = ((summary as Record<string, unknown> | null)?.plays as unknown[]) ?? []

  return plays
    .filter((p) => {
      const t = (((p as Record<string, unknown>).type as Record<string, unknown> | undefined)
        ?.text as string ?? '').toLowerCase()
      return t.includes('goal') || t.includes('yellow') || t.includes('red')
    })
    .map((p) => {
      const play = p as Record<string, unknown>
      const typeText = (((play.type as Record<string, unknown> | undefined)?.text as string) ?? '').toLowerCase()
      const clock = play.clock as Record<string, unknown> | undefined
      const participants = play.participants as Record<string, unknown>[] | undefined
      const athlete = participants?.[0]?.athlete as Record<string, unknown> | undefined

      const type: LiveEvent['type'] = typeText.includes('yellow')
        ? 'yellowCard'
        : typeText.includes('red')
          ? 'redCard'
          : 'goal'

      const playTeamId = String((play.team as Record<string, unknown> | undefined)?.id ?? '')

      return {
        type,
        minute: (clock?.displayValue as string) ?? '',
        team: playTeamId === homeTeamId ? 'home' : 'away',
        playerName: (athlete?.displayName as string) ?? '',
      } satisfies LiveEvent
    })
}
