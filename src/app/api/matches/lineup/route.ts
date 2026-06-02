import { NextResponse } from 'next/server'

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.2'
const CEUTA_ID = '5404'

export interface LineupPlayer {
  name: string
  shortName: string
  jersey: string
  position: string      // ESPN position displayName
  positionAbbr: string  // e.g. GK, CB, LB, CM...
  starter: boolean
  photoUrl: string | null
}

export interface MatchEvent {
  type: 'goal' | 'yellow-card' | 'red-card'
  minute: string
  playerName: string
  team: 'home' | 'away'
}

export interface MatchLineup {
  formation: string
  starters: LineupPlayer[]
  bench: LineupPlayer[]
  events: MatchEvent[]
  available: boolean
}

// Map ESPN position display names → short abbreviations
const POS_MAP: Record<string, string> = {
  'Goalkeeper': 'GK',
  'Center Left Defender': 'CB',
  'Center Right Defender': 'CB',
  'Left Back': 'LB',
  'Right Back': 'RB',
  'Left Midfielder': 'LM',
  'Right Midfielder': 'RM',
  'Center Midfielder': 'CM',
  'Defensive Midfielder': 'DM',
  'Attacking Midfielder': 'CAM',
  'Attacking Midfielder Left': 'LW',
  'Attacking Midfielder Right': 'RW',
  'Forward': 'CF',
  'Center Forward': 'CF',
  'Left Forward': 'LW',
  'Right Forward': 'RW',
  'Substitute': 'SUB',
}

function mapPlayer(p: Record<string, unknown>): LineupPlayer {
  const athlete = p.athlete as Record<string, unknown>
  const pos = p.position as Record<string, unknown> | undefined
  const posName = (pos?.displayName as string) ?? ''
  const links = athlete.links as { href: string; rel: string[] }[] ?? []
  const photoLink = links.find(l => l.rel?.includes('headshot'))
  return {
    name: athlete.displayName as string,
    shortName: athlete.shortName as string,
    jersey: String(p.jersey ?? ''),
    position: posName,
    positionAbbr: POS_MAP[posName] ?? posName.slice(0, 3).toUpperCase(),
    starter: Boolean(p.starter),
    photoUrl: photoLink?.href ?? null,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')

  if (!eventId) {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 })
  }

  const res = await fetch(`${ESPN}/summary?event=${eventId}`, {
    next: { revalidate: 120 }, // cache 2 min
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'ESPN unavailable' }, { status: 502 })
  }

  const data = await res.json()
  const rosters: Record<string, unknown>[] = data.rosters ?? []

  // Find Ceuta's roster
  const ceutaRoster = rosters.find((r) => {
    const team = r.team as Record<string, unknown>
    return String(team.id) === CEUTA_ID
  })

  if (!ceutaRoster) {
    return NextResponse.json({ available: false })
  }

  const players = (ceutaRoster.roster as Record<string, unknown>[]) ?? []
  const starters = players.filter(p => p.starter).map(mapPlayer)

  if (starters.length < 11) {
    return NextResponse.json({ available: false })
  }

  const bench = players.filter(p => !p.starter).map(mapPlayer)

  // Parse key events
  const keyEvents: Record<string, unknown>[] = data.keyEvents ?? data.header?.competitions?.[0]?.keyEvents ?? []
  // Also check competitions array
  const competitionEvents: Record<string, unknown>[] = data.header?.competitions?.[0]?.details ?? []
  const allEvents = keyEvents.length > 0 ? keyEvents : competitionEvents

  // Get home/away team IDs for mapping
  const competitors: Record<string, unknown>[] = data.header?.competitions?.[0]?.competitors ?? []
  const homeTeam = competitors.find(c => (c as Record<string, unknown>).homeAway === 'home')
  const homeTeamId = homeTeam ? String((homeTeam as Record<string, unknown>).id ?? '') : ''

  const EVENT_TYPES: Record<string, MatchEvent['type'] | undefined> = {
    'goal': 'goal',
    'yellow card': 'yellow-card',
    'red card': 'red-card',
    'yellow-card': 'yellow-card',
    'red-card': 'red-card',
  }

  const events: MatchEvent[] = allEvents
    .filter(ev => {
      const typeStr = String((ev.type as Record<string, unknown>)?.type ?? (ev.type as Record<string, unknown>)?.name ?? '').toLowerCase()
      return EVENT_TYPES[typeStr] !== undefined
    })
    .map(ev => {
      const typeStr = String((ev.type as Record<string, unknown>)?.type ?? (ev.type as Record<string, unknown>)?.name ?? '').toLowerCase()
      const athlete = ev.athletes as Record<string, unknown>[] | undefined
      const playerName = athlete?.[0]
        ? String((athlete[0].athlete as Record<string, unknown>)?.displayName ?? athlete[0].displayName ?? '')
        : String((ev.text as string) ?? '')
      const teamId = String((ev.team as Record<string, unknown>)?.id ?? '')
      return {
        type: EVENT_TYPES[typeStr]!,
        minute: String((ev.clock as Record<string, unknown>)?.displayValue ?? ev.period ?? ''),
        playerName,
        team: teamId === homeTeamId ? 'home' : 'away',
      }
    })

  const lineup: MatchLineup = {
    formation: (ceutaRoster.formation as string) ?? '4-4-2',
    starters,
    bench,
    events,
    available: true,
  }

  return NextResponse.json(lineup)
}
