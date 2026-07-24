export interface ScrapedMatch {
  homeTeam: string
  awayTeam: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
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
  date: string // YYYY-MM-DD
  weekday: string
  result: 'W' | 'D' | 'L'
  isHome: boolean
  espnEventId: string | null
}
