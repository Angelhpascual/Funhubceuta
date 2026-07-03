export interface LineupPlayer {
  name: string
  shortName: string
  jersey: string
  position: string
  positionAbbr: string
  starter: boolean
  photoUrl: string | null
}

export interface MatchEvent {
  type: 'goal' | 'yellow-card' | 'red-card' | 'substitution'
  minute: string
  playerName: string
  playerOut?: string
  team: 'home' | 'away'
}

export interface MatchLineup {
  formation: string
  starters: LineupPlayer[]
  bench: LineupPlayer[]
  events: MatchEvent[]
  available: boolean
}
