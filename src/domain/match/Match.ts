export type MatchStatus = 'scheduled' | 'finished' | 'live'

export interface Match {
  id: string
  externalId: string
  homeTeam: string
  awayTeam: string
  homeTeamLogo: string | null
  awayTeamLogo: string | null
  homeScore: number | null
  awayScore: number | null
  date: string | null
  matchday: number | null
  season: string
  competition: string
  status: MatchStatus
  venue: string | null
  createdAt: string
  updatedAt: string
}
