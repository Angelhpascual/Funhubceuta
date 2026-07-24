import { PartidosPage } from '@/features/matches/PartidosPage'
import { fetchSeasonMatches, fetchPreviousSeasonMatches } from '@/lib/serverFetches'

export const revalidate = 300

export default async function PartidosServerPage() {
  const [{ upcoming, results }, previousSeason] = await Promise.all([
    fetchSeasonMatches(),
    fetchPreviousSeasonMatches(),
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
