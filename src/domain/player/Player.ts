export type Position = 'GK' | 'DEF' | 'MID' | 'FWD'
export type Foot = 'left' | 'right' | 'both'
export type StatusType = 'injury' | 'suspension'
export type Competition = 'Segunda División' | 'Copa del Rey'

export interface Player {
  id: string
  name: string
  slug: string
  position: Position | null
  nationality: string | null
  birthDate: string | null
  jerseyNumber: number | null
  photoUrl: string | null
  heightCm: number | null
  weightKg: number | null
  foot: Foot | null
  marketValue: number | null
  season: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PlayerStats {
  id: string
  playerId: string
  season: string
  competition: Competition
  matchesPlayed: number
  matchesStarted: number
  minutesPlayed: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  cleanSheets: number
  saves: number
  createdAt: string
  updatedAt: string
}

export interface PlayerStatus {
  id: string
  playerId: string
  type: StatusType
  reason: string | null
  expectedReturn: string | null
  isActive: boolean
  matchBan: number | null
  matchesRemaining: number | null
  createdAt: string
  updatedAt: string
}

export interface PlayerWithStatus extends Player {
  status: PlayerStatus | null
  stats: PlayerStats[]
}
