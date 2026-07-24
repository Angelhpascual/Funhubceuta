export type PredictionMatchMeta = {
  home: { name: string; logo: string | null }
  away: { name: string; logo: string | null }
}

export type PredictionResult = { home: number; away: number } | null

export type PredictionSession = {
  id: string
  match_label: string
  match_meta: PredictionMatchMeta | null
  jornada: string | null
  status: 'pending' | 'open' | 'closed'
  result: PredictionResult
  created_at: string
  opened_at: string | null
  closed_at: string | null
}

export type UserPrediction = {
  id: string
  session_id: string
  fingerprint: string
  home_score: number
  away_score: number
  points: number | null
  created_at: string
}
