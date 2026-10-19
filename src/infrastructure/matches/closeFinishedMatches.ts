import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { setConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { fetchEspnMatchResult } from '@/infrastructure/espn/fetchMatchResult'

// The club's own site is the only source for upcoming fixtures/ticket links,
// but it's an unreliable source for closing out *results* — it can lag days
// behind or never publish a given match. ESPN has the final score the moment
// the match ends, so it's the authority for marking a match 'finished',
// independent of whether the live cron was tracking it live.
//
// This used to run only inside the weekly cron/matches fixture sync, gated
// by `date < today` — so a match finished *today* (e.g. an evening kickoff
// closed out by a 23:00 run) was skipped, and with cron/matches only running
// ~weekly, it could sit unclosed for up to a week (confirmed with
// Ceuta-Oviedo, 2026-10-18). Pulled out into its own module so a separate,
// much more frequent cron (cron/close-finished-matches) can call it without
// depending on the heavy weekly schedule-refresh at all.
export async function closeFinishedMatchesFromEspn(
  repo: MatchesSupabaseRepository
): Promise<string[]> {
  const pending = await repo.fetchUnfinishedPast()
  const closed: string[] = []

  for (const match of pending) {
    const espnResult = await fetchEspnMatchResult(match.espnEventId)
    if (!espnResult || espnResult.state !== 'post') continue

    const ceutaIsHome = match.homeTeam.toLowerCase().includes('ceuta')
    const ceutaScore = ceutaIsHome ? espnResult.homeScore : espnResult.awayScore
    const rivalScore = ceutaIsHome ? espnResult.awayScore : espnResult.homeScore
    const result = ceutaScore > rivalScore ? 'W' : ceutaScore < rivalScore ? 'L' : 'D'

    await repo.markMatchFinished(match.espnEventId, espnResult.homeScore, espnResult.awayScore, result)
    closed.push(match.espnEventId)
  }

  return closed
}

// Persists ceuta_form if there's anything to persist — callers decide what
// to pass (e.g. cron/matches falls back to the club site's scrape when the
// DB-derived form is empty; the no-side-effect read lives in
// MatchesSupabaseRepository.fetchRecentForm()).
export async function persistCeutaForm(form: string[]): Promise<void> {
  if (form.length > 0) {
    await setConfig('ceuta_form', form.join(','))
  }
}
