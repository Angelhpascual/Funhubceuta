import { PartidosPage } from '@/features/matches/PartidosPage'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { CURRENT_MATCH_SEASON, PREVIOUS_MATCH_SEASON } from '@/lib/constants'

export const revalidate = 300

const repo = new MatchesSupabaseRepository()

export default async function PartidosServerPage() {
  const [{ upcoming, results }, previousSeason] = await Promise.all([
    repo.fetchSeasonMatches(CURRENT_MATCH_SEASON),
    repo.fetchBySeason(PREVIOUS_MATCH_SEASON, 200),
  ])

  const previous = previousSeason
    .filter((m) => m.status === 'finished')
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <PartidosPage
      upcoming={upcoming}
      results={results}
      previousSeason={previous}
    />
  )
}
