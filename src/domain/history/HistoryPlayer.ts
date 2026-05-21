export interface HistoryPlayer {
  id: string
  name: string
  slug: string
  position: "GK" | "DEF" | "MID" | "FWD" | null
  nationality: string | null
  birthDate: string | null
  photoUrl: string | null
  seasonFrom: string | null
  seasonTo: string | null
  matchesPlayed: number
  goals: number
  assists: number
  isLegend: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}
