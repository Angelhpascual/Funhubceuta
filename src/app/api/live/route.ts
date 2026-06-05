import { NextResponse } from 'next/server'
import { ESPN_SCOREBOARD, ESPN_SUMMARY } from '@/lib/constants'
import { getConfig } from '@/infrastructure/supabase/AppConfigRepository'

// Cache 60s — multiple users share the same ESPN response
export const revalidate = 0

export interface LiveEvent {
  type: 'goal' | 'yellowCard' | 'redCard' | 'substitution'
  minute: string
  team: 'home' | 'away'
  playerName: string
}

export interface LiveMatch {
  espnId: string
  state: 'pre' | 'in' | 'post'
  status: string        // "Scheduled" | "1st Half" | "Half Time" | "2nd Half" | "Full Time"
  clock: string         // "23'" | "HT" | ""
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  events: LiveEvent[]
  venue: string
  startDate: string
}


async function fetchEspn(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 60 },
  })
  if (!res.ok) return null
  return res.json()
}

export async function GET() {
  // In dev: use mock if it exists
  if (process.env.NODE_ENV !== 'production') {
    const mock = await getConfig('live_match_mock')
    if (mock) return NextResponse.json({ match: JSON.parse(mock) })
  }

  const scoreboard = await fetchEspn(ESPN_SCOREBOARD)
  if (!scoreboard) return NextResponse.json({ match: null })

  const events: unknown[] = scoreboard.events ?? []

  // Find Ceuta match
  const ceutaEvent = events.find((e: unknown) => {
    const ev = e as Record<string, unknown>
    return JSON.stringify(ev).toLowerCase().includes('ceuta')
  }) as Record<string, unknown> | undefined

  if (!ceutaEvent) return NextResponse.json({ match: null })

  const competition = (ceutaEvent.competitions as Record<string, unknown>[])?.[0]
  if (!competition) return NextResponse.json({ match: null })

  const status = competition.status as Record<string, unknown>
  const statusType = status?.type as Record<string, unknown>
  const competitors = competition.competitors as Record<string, unknown>[]

  const home = competitors?.find(c => (c as Record<string, unknown>).homeAway === 'home') as Record<string, unknown>
  const away = competitors?.find(c => (c as Record<string, unknown>).homeAway === 'away') as Record<string, unknown>
  const homeTeamData = home?.team as Record<string, unknown>
  const awayTeamData = away?.team as Record<string, unknown>
  const venue = competition.venue as Record<string, unknown>

  const state = statusType?.state as string
  const clockDisplay = (status?.displayClock as string) ?? ''
  const statusDesc = statusType?.description as string

  // Fetch play-by-play events only during/after match
  let liveEvents: LiveEvent[] = []
  if (state === 'in' || state === 'post') {
    const summary = await fetchEspn(`${ESPN_SUMMARY}?event=${ceutaEvent.id}`)
    const plays: unknown[] = summary?.plays ?? []

    liveEvents = plays
      .filter((p: unknown) => {
        const play = p as Record<string, unknown>
        const type = ((play.type as Record<string, unknown>)?.text as string ?? '').toLowerCase()
        return type.includes('goal') || type.includes('yellow') || type.includes('red')
      })
      .map((p: unknown) => {
        const play = p as Record<string, unknown>
        const typeText = ((play.type as Record<string, unknown>)?.text as string ?? '').toLowerCase()
        const clock = play.clock as Record<string, unknown>
        const participants = play.participants as Record<string, unknown>[] ?? []
        const athlete = participants[0]?.athlete as Record<string, unknown>

        let type: LiveEvent['type'] = 'goal'
        if (typeText.includes('yellow')) type = 'yellowCard'
        else if (typeText.includes('red')) type = 'redCard'
        else if (typeText.includes('substitution')) type = 'substitution'

        const playTeamId = (play.team as Record<string, unknown>)?.id
        const team: 'home' | 'away' = playTeamId === (homeTeamData?.id) ? 'home' : 'away'

        return {
          type,
          minute: clock?.displayValue as string ?? '',
          team,
          playerName: athlete?.displayName as string ?? '',
        }
      })
  }

  const match: LiveMatch = {
    espnId: ceutaEvent.id as string,
    state: (state as 'pre' | 'in' | 'post') ?? 'pre',
    status: statusDesc ?? '',
    clock: state === 'in' ? (clockDisplay || '') : '',
    homeTeam: homeTeamData?.displayName as string ?? '',
    awayTeam: awayTeamData?.displayName as string ?? '',
    homeScore: parseInt(home?.score as string ?? '0'),
    awayScore: parseInt(away?.score as string ?? '0'),
    events: liveEvents,
    venue: (venue as Record<string, unknown>)?.fullName as string ?? '',
    startDate: ceutaEvent.date as string ?? '',
  }

  // Don't show a finished match that ended more than 3 hours ago
  if (state === 'post') {
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
        } catch { /* ignore */ }
      }
    }
  }

  return NextResponse.json({ match })
}
