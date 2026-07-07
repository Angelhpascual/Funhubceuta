import { PartidosPage } from '@/features/matches/PartidosPage'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { CURRENT_SEASON } from '@/lib/constants'

export const revalidate = 300

const repo = new MatchesSupabaseRepository()

export default async function PartidosServerPage() {
  const { upcoming, results } = await repo.fetchSeasonMatches(CURRENT_SEASON)

  return (
    <PartidosPage
      upcoming={upcoming}
      results={results}
    />
  )
}
