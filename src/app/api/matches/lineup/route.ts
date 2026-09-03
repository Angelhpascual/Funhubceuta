import { NextResponse } from 'next/server'
import { fetchPhotosByDorsal } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { parseLineupEvents } from '../parseLineupEvents'
import { ESPN_BASE as ESPN, ESPN_CEUTA_ID as CEUTA_ID, CURRENT_SEASON } from '@/lib/constants'
import { apiError } from '@/lib/apiError'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import type { LineupPlayer, MatchEvent, MatchLineup } from '@/domain/match/Lineup'

export type { LineupPlayer, MatchEvent, MatchLineup }

// Map ESPN position display names → short abbreviations
const POS_MAP: Record<string, string> = {
  Goalkeeper: 'GK',
  'Center Defender': 'CB',
  'Center Left Defender': 'CB',
  'Center Right Defender': 'CB',
  'Left Back': 'LB',
  'Right Back': 'RB',
  'Left Midfielder': 'LM',
  'Right Midfielder': 'RM',
  'Center Midfielder': 'CM',
  'Center Left Midfielder': 'CM',
  'Center Right Midfielder': 'CM',
  'Defensive Midfielder': 'DM',
  'Attacking Midfielder': 'CAM',
  'Attacking Midfielder Left': 'LW',
  'Attacking Midfielder Right': 'RW',
  Forward: 'CF',
  'Center Forward': 'CF',
  'Left Forward': 'LW',
  'Right Forward': 'RW',
  Substitute: 'SUB',
}

function mapPlayer(p: Record<string, unknown>): LineupPlayer {
  const athlete = p.athlete as Record<string, unknown>
  const pos = p.position as Record<string, unknown> | undefined
  const posName = (pos?.displayName as string) ?? ''
  // ESPN provides jersey image (kit with number) for soccer players in this endpoint
  const jerseyImages = (athlete.jerseyImages as { href: string; rel: string[] }[] | undefined) ?? []
  const jerseyImg = jerseyImages.find((j) => (j.rel ?? []).includes('default')) ?? jerseyImages[0]
  const headshot = athlete.headshot as Record<string, unknown> | undefined
  const links = (athlete.links as { href: string; rel: string[] }[] | undefined) ?? []
  const photoLink = links.find((l) => l.rel?.includes('headshot'))
  const photoUrl = (headshot?.href as string) ?? photoLink?.href ?? jerseyImg?.href ?? null
  return {
    name: athlete.displayName as string,
    shortName: athlete.shortName as string,
    jersey: String(p.jersey ?? ''),
    position: posName,
    positionAbbr: POS_MAP[posName] ?? posName.slice(0, 3).toUpperCase(),
    starter: Boolean(p.starter),
    photoUrl,
  }
}

export async function GET(request: Request) {
  try {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')

  if (!eventId) {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 })
  }

  const res = await fetchWithTimeout(`${ESPN}/summary?event=${eventId}`, {
    next: { revalidate: 120 },
  }, 15_000)

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
  const starters = players.filter((p) => p.starter).map(mapPlayer)

  if (starters.length < 11) {
    return NextResponse.json({ available: false })
  }

  const bench = players.filter((p) => !p.starter).map(mapPlayer)

  // Enrich photos from our squad table (keyed by jersey number)
  const photoByDorsal = await fetchPhotosByDorsal(CURRENT_SEASON)

  const enrich = (p: LineupPlayer): LineupPlayer => ({
    ...p,
    photoUrl: photoByDorsal[p.jersey] ?? p.photoUrl,
  })

  const enrichedStarters = starters.map(enrich)
  const enrichedBench = bench.map(enrich)

  // Parse key events
  const keyEvents: Record<string, unknown>[] =
    data.keyEvents ?? data.header?.competitions?.[0]?.keyEvents ?? []
  // Also check competitions array
  const competitionEvents: Record<string, unknown>[] = data.header?.competitions?.[0]?.details ?? []
  const allEvents = keyEvents.length > 0 ? keyEvents : competitionEvents

  // Get home/away team IDs for mapping
  const competitors: Record<string, unknown>[] = data.header?.competitions?.[0]?.competitors ?? []
  const homeTeam = competitors.find((c) => (c as Record<string, unknown>).homeAway === 'home')
  const homeTeamId = homeTeam ? String((homeTeam as Record<string, unknown>).id ?? '') : ''

  const events = parseLineupEvents(allEvents, homeTeamId)

  const lineup: MatchLineup = {
    formation: (ceutaRoster.formation as string) ?? '4-4-2',
    starters: enrichedStarters,
    bench: enrichedBench,
    events,
    available: true,
  }

  // A finished match's lineup never changes again — cache it aggressively.
  // In-progress/scheduled lineups can still change, so keep those short-lived.
  const matchState = data.header?.competitions?.[0]?.status?.type?.state as string | undefined
  const cacheControl =
    matchState === 'post'
      ? 'public, s-maxage=31536000, immutable'
      : 'public, s-maxage=60, stale-while-revalidate=30'

  return NextResponse.json(lineup, { headers: { 'Cache-Control': cacheControl } })
  } catch (err) {
    return apiError(err)
  }
}
