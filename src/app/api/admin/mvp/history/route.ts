import { NextResponse } from 'next/server'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { APP_ENV } from '@/lib/appEnv'
import { getMvpSeasonRanking } from '@/infrastructure/supabase/MvpRepository'
import { withApi } from '@/lib/apiError'

export const GET = withApi(async () => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  const { data: sessions } = await supabaseAdmin
    .from('mvp_sessions')
    .select('id, match_label, winner_name, winner_votes, closed_at, candidates')
    .eq('environment', APP_ENV)
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

  const seasonRanking = await getMvpSeasonRanking()

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
