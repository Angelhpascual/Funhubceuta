import { supabaseAdmin } from './adminClient'

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

export async function getActivePredictionSession(): Promise<PredictionSession | null> {
  const { data } = await supabaseAdmin
    .from('prediction_sessions')
    .select('*')
    .in('status', ['pending', 'open', 'closed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data as PredictionSession | null
}

export async function getUserPrediction(sessionId: string, fingerprint: string): Promise<UserPrediction | null> {
  const { data } = await supabaseAdmin
    .from('prediction_votes')
    .select('*')
    .eq('session_id', sessionId)
    .eq('fingerprint', fingerprint)
    .maybeSingle()
  return data as UserPrediction | null
}

export async function upsertPrediction(
  sessionId: string,
  fingerprint: string,
  home: number,
  away: number,
  nickname?: string
) {
  const { data, error } = await supabaseAdmin
    .from('prediction_votes')
    .upsert(
      { session_id: sessionId, fingerprint, home_score: home, away_score: away, ...(nickname ? { nickname } : {}) },
      { onConflict: 'session_id,fingerprint' }
    )
    .select()
    .single()
  return { data, error }
}

export async function createPredictionSession(
  matchLabel: string,
  jornada: string,
  matchMeta?: PredictionMatchMeta
) {
  const { data, error } = await supabaseAdmin
    .from('prediction_sessions')
    .insert({ match_label: matchLabel, jornada, status: 'pending', match_meta: matchMeta ?? null, result: null })
    .select()
    .single()
  return { data, error }
}

export async function openPredictionSession(sessionId: string) {
  const { error } = await supabaseAdmin
    .from('prediction_sessions')
    .update({ status: 'open', opened_at: new Date().toISOString() })
    .eq('id', sessionId)
  return { error }
}

export async function closePredictionSession(
  sessionId: string,
  homeResult: number,
  awayResult: number
) {
  // Calcular puntos para cada predicción
  const { data: votes } = await supabaseAdmin
    .from('prediction_votes')
    .select('*')
    .eq('session_id', sessionId)

  if (votes) {
    for (const vote of votes) {
      const exact = vote.home_score === homeResult && vote.away_score === awayResult
      const correctWinner =
        (vote.home_score > vote.away_score && homeResult > awayResult) ||
        (vote.home_score < vote.away_score && homeResult < awayResult) ||
        (vote.home_score === vote.away_score && homeResult === awayResult)
      const points = exact ? 50 : correctWinner ? 15 : 0
      await supabaseAdmin
        .from('prediction_votes')
        .update({ points })
        .eq('id', vote.id)
    }
  }

  const { error } = await supabaseAdmin
    .from('prediction_sessions')
    .update({
      status: 'closed',
      result: { home: homeResult, away: awayResult },
      closed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
  return { error }
}

export async function getPredictionHistory() {
  const { data: sessions } = await supabaseAdmin
    .from('prediction_sessions')
    .select('id, match_label, jornada, result, closed_at')
    .in('status', ['closed', 'archived'])
    .order('closed_at', { ascending: false })
    .limit(20)

  if (!sessions) return []

  const result = await Promise.all(sessions.map(async (s) => {
    const { data: votes } = await supabaseAdmin
      .from('prediction_votes')
      .select('nickname, fingerprint, home_score, away_score, points')
      .eq('session_id', s.id)
      .order('points', { ascending: false })
    return { ...s, votes: votes ?? [] }
  }))

  return result
}

export async function getPredictionSeasonRanking() {
  const { data } = await supabaseAdmin
    .from('prediction_votes')
    .select('fingerprint, points, home_score, away_score, nickname')
    .not('points', 'is', null)

  if (!data) return []

  const totals: Record<string, { points: number; exactos: number; nickname: string | null }> = {}
  for (const row of data) {
    // Agrupar por nickname si existe, si no por fingerprint
    const key = row.nickname?.trim() || row.fingerprint
    const prev = totals[key] ?? { points: 0, exactos: 0, nickname: null }
    totals[key] = {
      points: prev.points + (row.points ?? 0),
      exactos: prev.exactos + (row.points === 50 ? 1 : 0),
      nickname: row.nickname ?? prev.nickname,
    }
  }

  return Object.entries(totals)
    .map(([key, stats]) => ({ fingerprint: key, ...stats }))
    .sort((a, b) => b.points - a.points || b.exactos - a.exactos)
    .slice(0, 20)
}
