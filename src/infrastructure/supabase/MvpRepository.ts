import { supabaseAdmin } from './adminClient'

export type MvpCandidate = {
  id: string
  name: string
  number: number
  position: string
  photo_url?: string
}

export type MvpMatchMeta = {
  home: { name: string; logo: string | null }
  away: { name: string; logo: string | null }
}

export type MvpSession = {
  id: string
  match_label: string
  match_meta: MvpMatchMeta | null
  candidates: MvpCandidate[]
  status: 'pending' | 'open' | 'closed'
  winner_id: string | null
  winner_name: string | null
  winner_votes: number | null
  opened_at: string | null
  closed_at: string | null
  created_at: string
}

export type MvpVoteTally = { candidate_id: string; count: number }

export async function getActiveMvpSession(): Promise<MvpSession | null> {
  const { data } = await supabaseAdmin
    .from('mvp_sessions')
    .select('*')
    .in('status', ['pending', 'open', 'closed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data as MvpSession | null
}

export async function getMvpVoteTallies(sessionId: string): Promise<MvpVoteTally[]> {
  const { data } = await supabaseAdmin
    .from('mvp_votes')
    .select('candidate_id')
    .eq('session_id', sessionId)
  if (!data) return []
  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.candidate_id] = (counts[row.candidate_id] ?? 0) + 1
  }
  return Object.entries(counts).map(([candidate_id, count]) => ({ candidate_id, count }))
}

export async function castMvpVote(sessionId: string, candidateId: string, fingerprint: string) {
  const { error } = await supabaseAdmin
    .from('mvp_votes')
    .insert({ session_id: sessionId, candidate_id: candidateId, fingerprint })
  return { error }
}

export async function hasVoted(sessionId: string, fingerprint: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('mvp_votes')
    .select('id')
    .eq('session_id', sessionId)
    .eq('fingerprint', fingerprint)
    .maybeSingle()
  return !!data
}

export async function createMvpSession(matchLabel: string, candidates: MvpCandidate[], matchMeta?: MvpMatchMeta) {
  const { data, error } = await supabaseAdmin
    .from('mvp_sessions')
    .insert({ match_label: matchLabel, candidates, status: 'pending', match_meta: matchMeta ?? null })
    .select()
    .single()
  return { data, error }
}

export async function openMvpSession(sessionId: string) {
  const { error } = await supabaseAdmin
    .from('mvp_sessions')
    .update({ status: 'open', opened_at: new Date().toISOString() })
    .eq('id', sessionId)
  return { error }
}

export async function closeMvpSession(sessionId: string) {
  // Compute winner
  const tallies = await getMvpVoteTallies(sessionId)
  const { data: session } = await supabaseAdmin
    .from('mvp_sessions')
    .select('candidates')
    .eq('id', sessionId)
    .single()

  let winnerId: string | null = null
  let winnerName: string | null = null
  let winnerVotes: number | null = null

  if (tallies.length > 0) {
    const top = tallies.sort((a, b) => b.count - a.count)[0]
    winnerId = top.candidate_id
    winnerVotes = top.count
    const candidates = (session?.candidates ?? []) as MvpCandidate[]
    winnerName = candidates.find((c) => c.id === winnerId)?.name ?? null
  }

  const { error } = await supabaseAdmin
    .from('mvp_sessions')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      winner_id: winnerId,
      winner_name: winnerName,
      winner_votes: winnerVotes,
    })
    .eq('id', sessionId)
  return { error }
}

export async function getMvpHistory(limit = 10) {
  const { data } = await supabaseAdmin
    .from('mvp_sessions')
    .select('id, match_label, winner_name, winner_votes, closed_at')
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getMvpSeasonRanking() {
  const { data } = await supabaseAdmin
    .from('mvp_sessions')
    .select('winner_name, winner_id, winner_votes, candidates')
    .eq('status', 'closed')
    .not('winner_name', 'is', null)

  if (!data) return []
  const totals: Record<string, { wins: number; votes: number; photo_url: string | null }> = {}
  for (const row of data) {
    if (!row.winner_name) continue
    const prev = totals[row.winner_name] ?? { wins: 0, votes: 0, photo_url: null }
    const photo = prev.photo_url
      ?? (row.candidates as MvpCandidate[])?.find(c => c.id === row.winner_id)?.photo_url
      ?? null
    totals[row.winner_name] = {
      wins: prev.wins + 1,
      votes: prev.votes + (row.winner_votes ?? 0),
      photo_url: photo,
    }
  }
  return Object.entries(totals)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.wins - a.wins || b.votes - a.votes)
}
