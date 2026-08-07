import { ClasificacionPage } from './ClasificacionPage'
import { standingsService } from '@/lib/services'
import { STANDINGS_CURRENT_SEASON, STANDINGS_PREVIOUS_SEASON } from '@/lib/constants'
import { fetchCeutaForm } from '@/lib/serverFetches'

export async function ClasificacionContent() {
  const [standings, previousStandings, form] = await Promise.all([
    standingsService.getStandings(STANDINGS_CURRENT_SEASON),
    standingsService.getStandings(STANDINGS_PREVIOUS_SEASON),
    fetchCeutaForm(),
  ])
  return (
    <ClasificacionPage
      entries={standings?.entries ?? []}
      previousEntries={previousStandings?.entries ?? []}
      form={form}
    />
  )
}
