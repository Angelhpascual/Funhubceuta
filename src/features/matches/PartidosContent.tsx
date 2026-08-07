import { fetchSeasonMatches, fetchPreviousSeasonMatches } from '@/lib/serverFetches'
import { PartidosPage } from './PartidosPage'

export async function PartidosContent() {
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
