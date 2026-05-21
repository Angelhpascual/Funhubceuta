export interface StandingEntry {
  id: string
  externalId: string
  season: string
  position: number
  teamName: string
  teamLogo: string | null
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  form: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface Standings {
  season: string
  entries: StandingEntry[]
}
