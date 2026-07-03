import { PartidosPage } from '@/features/matches/PartidosPage'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { fetchTeamLogos } from '@/lib/serverFetches'
import { STANDINGS_CURRENT_SEASON, STANDINGS_PREVIOUS_SEASON } from '@/lib/constants'

export const revalidate = 300

const repo = new MatchesSupabaseRepository()

export default async function PartidosServerPage() {
  const [{ upcoming, results }, previousSeason, logos] = await Promise.all([
    repo.fetchSeasonMatches(STANDINGS_CURRENT_SEASON),
    repo.fetchBySeason(STANDINGS_PREVIOUS_SEASON, 200),
    fetchTeamLogos(),
  ])

  const previous = previousSeason.sort((a, b) => b.date.localeCompare(a.date))

  return (
    <PartidosPage
      upcoming={upcoming}
      results={results}
      previousSeason={previous}
      logos={logos}
    />
  )
}
