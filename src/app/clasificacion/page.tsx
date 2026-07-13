import { ClasificacionPage } from '@/features/standings/ClasificacionPage'
import { StandingsService } from '@/domain/standings/StandingsService'
import { StandingsSupabaseRepository } from '@/infrastructure/supabase/StandingsSupabaseRepository'
import { STANDINGS_CURRENT_SEASON, STANDINGS_PREVIOUS_SEASON } from '@/lib/constants'
import { fetchCeutaForm } from '@/lib/serverFetches'

export const revalidate = 300

export default async function ClasificacionServerPage() {
  console.log('[DEBUG] SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  const service = new StandingsService(new StandingsSupabaseRepository())
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
