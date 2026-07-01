import { ClasificacionPage } from '@/features/standings/ClasificacionPage'
import { StandingsService } from '@/domain/standings/StandingsService'
import { StandingsSupabaseRepository } from '@/infrastructure/supabase/StandingsSupabaseRepository'
import { STANDINGS_CURRENT_SEASON, STANDINGS_PREVIOUS_SEASON } from '@/lib/constants'
import { fetchCeutaForm, fetchTeamLogos } from '@/lib/serverFetches'

export const revalidate = 300

export default async function ClasificacionServerPage() {
  const service = new StandingsService(new StandingsSupabaseRepository())
  const [standings, previousStandings, form, logos] = await Promise.all([
    service.getStandings(STANDINGS_CURRENT_SEASON),
    service.getStandings(STANDINGS_PREVIOUS_SEASON),
    fetchCeutaForm(),
    fetchTeamLogos(),
  ])

  return (
    <ClasificacionPage
      entries={standings?.entries ?? []}
      previousEntries={previousStandings?.entries ?? []}
      form={form}
      logos={logos}
    />
  )
}
