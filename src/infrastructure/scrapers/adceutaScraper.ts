const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.2'
const CEUTA_ID = '5404'

export interface ScrapedMatch {
  homeTeam: string
  awayTeam: string
  date: string    // YYYY-MM-DD
  time: string    // HH:MM
  weekday: string
  isHome: boolean
  ticketsUrl: string | null
  espnEventId: string | null
}

export interface ScrapedResult {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  date: string      // YYYY-MM-DD
  weekday: string
  result: 'W' | 'D' | 'L'
  isHome: boolean
  espnEventId: string | null
}

const WEEKDAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function parseScore(raw: unknown): number {
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') return parseInt(raw) || 0
  if (raw && typeof raw === 'object') {
    const v = (raw as Record<string, unknown>).displayValue ?? (raw as Record<string, unknown>).value
    return typeof v === 'string' ? parseInt(v) || 0 : Number(v) || 0
  }
  return 0
}

async function fetchSchedule() {
  const res = await fetch(`${ESPN}/teams/${CEUTA_ID}/schedule`, { next: { revalidate: 0 } })
  if (!res.ok) return []
  const data = await res.json()
  return (data.events ?? []) as Record<string, unknown>[]
}

export async function scrapeNextMatches(): Promise<ScrapedMatch[]> {
  const events = await fetchSchedule()
  const today = new Date().toISOString().split('T')[0]

  return events
    .filter(e => {
      const comp = (e.competitions as Record<string, unknown>[])?.[0]
      const state = (comp?.status as Record<string, unknown>)?.type as Record<string, unknown>
      return (state?.state as string) === 'pre' && (e.date as string)?.slice(0, 10) >= today
    })
    .slice(0, 10)
    .map(e => {
      const comp = (e.competitions as Record<string, unknown>[])[0]
      const competitors = comp.competitors as Record<string, unknown>[]
      const home = competitors.find(c => c.homeAway === 'home')!
      const away = competitors.find(c => c.homeAway === 'away')!
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
    })
}

export async function scrapeNextMatch(): Promise<ScrapedMatch | null> {
  const all = await scrapeNextMatches()
  return all[0] ?? null
}

export async function scrapeRecentResults(limit = 10): Promise<ScrapedResult[]> {
  const events = await fetchSchedule()

  return events
    .filter(e => {
      const comp = (e.competitions as Record<string, unknown>[])?.[0]
      const state = (comp?.status as Record<string, unknown>)?.type as Record<string, unknown>
      return (state?.state as string) === 'post'
    })
    .slice(-limit)
    .reverse()
    .map(e => {
      const comp = (e.competitions as Record<string, unknown>[])[0]
      const competitors = comp.competitors as Record<string, unknown>[]
      const home = competitors.find(c => c.homeAway === 'home')!
      const away = competitors.find(c => c.homeAway === 'away')!
      const homeScore = parseScore(home.score)
      const awayScore = parseScore(away.score)
      const isHome = ((home.team as Record<string, unknown>).id as string) === CEUTA_ID
      const ceutaGoals = isHome ? homeScore : awayScore
      const oppGoals = isHome ? awayScore : homeScore
      const result: 'W' | 'D' | 'L' = ceutaGoals > oppGoals ? 'W' : ceutaGoals === oppGoals ? 'D' : 'L'
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
  return results.map(r => r.result)
}
