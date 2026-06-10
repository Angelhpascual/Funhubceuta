export interface Player {
  id: string
  dorsal: number | null
  name: string
  position: string
  position_group: string
  nationality: string
  height: string | null
  weight: string | null
  birth_date: string | null
  photo_url: string | null
}

export interface Group {
  group: string
  players: Player[]
}

export interface Leader {
  name: string
  value: number
  photo: string
}

export interface LeaderCategory {
  label: string
  icon: string
  leaders: Leader[]
}

export type LeadersMap = Record<string, LeaderCategory>
