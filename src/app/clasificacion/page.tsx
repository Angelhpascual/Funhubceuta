import { ClasificacionPage } from '@/features/standings/ClasificacionPage'
import { standingsService } from '@/lib/services'
import { STANDINGS_CURRENT_SEASON, STANDINGS_PREVIOUS_SEASON } from '@/lib/constants'
import { fetchCeutaForm } from '@/lib/serverFetches'

export const revalidate = 300

export default async function ClasificacionServerPage() {
const service = standingsService
  const [standings, previousStandings, form] = await Promise.all([
    service.getStandings(STANDINGS_CURRENT_SEASON),
    service.getStandings(STANDINGS_PREVIOUS_SEASON),
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
