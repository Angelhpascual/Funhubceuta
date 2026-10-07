import { ESPN_BASE } from '@/lib/constants'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { parseMatchCore } from './parseLiveMatch'

export interface EspnMatchResult {
  state: 'pre' | 'in' | 'post'
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
}

// Looks up a single match by its ESPN event id, independent of today's
// scoreboard — unlike findCeutaEvent() (used for live tracking), this works
// for any past event regardless of how many days ago it was played, which is
// exactly what's needed to reliably close out a 'scheduled' match in our DB
// once ESPN has the final score, instead of depending on the club's own
// site (whose scraper can lag days behind or never publish a given result).
export async function fetchEspnMatchResult(espnEventId: string): Promise<EspnMatchResult | null> {
  const res = await fetchWithTimeout(`${ESPN_BASE}/summary?event=${espnEventId}`, { cache: 'no-store' }, 15_000)
  if (!res.ok) return null

  const data = await res.json()
  const comp = data?.header?.competitions?.[0]
  if (!comp) return null

  const core = parseMatchCore({ id: comp.id, date: comp.date, competitions: [comp] })
  if (!core) return null

  return {
    state: core.state,
    homeTeam: core.homeTeam,
    awayTeam: core.awayTeam,
    homeScore: core.homeScore,
    awayScore: core.awayScore,
  }
}
