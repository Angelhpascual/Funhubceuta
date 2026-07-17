export interface LiveEvent {
  type: 'goal' | 'yellowCard' | 'redCard' | 'substitution'
  minute: string
  team: 'home' | 'away'
  playerName: string
}

export interface LineupPlayer {
  name: string
  jersey: string
  position: string
  starter: boolean
  photoUrl?: string | null
}

export interface MatchStat {
  name: string
  displayName: string
  home: string
  away: string
}

export interface LiveMatch {
  espnId: string
  state: 'pre' | 'in' | 'post'
  status: string
  clock: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  events: LiveEvent[]
  venue: string
  startDate: string
  homeLineup?: LineupPlayer[]
  awayLineup?: LineupPlayer[]
  stats?: MatchStat[]
}
