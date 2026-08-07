import { NextResponse } from 'next/server'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { withApi } from '@/lib/apiError'

export const GET = withApi(async () => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  // Admin always sees production history regardless of current deploy environment
  const { data: sessions } = await supabaseAdmin
    .from('mvp_sessions')
    .select('id, match_label, winner_name, winner_votes, closed_at, candidates')
    .eq('environment', 'production')
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })
    .limit(20)

  const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id)

  let votes: { session_id: string; candidate_id: string; fingerprint: string; created_at: string }[] = []
  if (sessionIds.length > 0) {
    const { data } = await supabaseAdmin
      .from('mvp_votes')
      .select('session_id, candidate_id, fingerprint, created_at')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true })
    votes = data ?? []
  }

  // Season ranking always from production data
  const { data: rankingData } = await supabaseAdmin
    .from('mvp_sessions')
    .select('winner_name, winner_votes, candidates')
    .eq('environment', 'production')
    .eq('status', 'closed')
    .not('winner_name', 'is', null)

  const winCounts: Record<string, { name: string; wins: number; votes: number; photo_url?: string }> = {}
  for (const s of rankingData ?? []) {
    if (!s.winner_name) continue
    const key = s.winner_name
    if (!winCounts[key]) {
      const photo = (s.candidates as { name: string; photo_url?: string }[])?.find(c => c.name === key)?.photo_url
      winCounts[key] = { name: key, wins: 0, votes: 0, photo_url: photo }
    }
    winCounts[key].wins++
    winCounts[key].votes += s.winner_votes ?? 0
  }
  const seasonRanking = Object.values(winCounts).sort((a, b) => b.wins - a.wins || b.votes - a.votes)

  const history = (sessions ?? []).map((s: {
    id: string
    match_label: string
    winner_name: string | null
    winner_votes: number | null
    closed_at: string | null
    candidates: { id: string; name: string; number: number; position: string }[]
  }) => {
    const sessionVotes = votes.filter(v => v.session_id === s.id)
    return {
      id: s.id,
      match_label: s.match_label,
      winner_name: s.winner_name,
      winner_votes: s.winner_votes,
      closed_at: s.closed_at,
      candidates: s.candidates ?? [],
      votes: sessionVotes.map(v => ({
        candidate_id: v.candidate_id,
        candidate_name: s.candidates?.find((c: { id: string }) => c.id === v.candidate_id)?.name ?? '?',
        fingerprint: v.fingerprint,
        created_at: v.created_at,
      })),
    }
  })

  return NextResponse.json({ history, seasonRanking })
})
