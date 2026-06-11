import { ClasificacionPage } from '@/features/standings/ClasificacionPage'
import { StandingsService } from '@/domain/standings/StandingsService'
import { StandingsSupabaseRepository } from '@/infrastructure/supabase/StandingsSupabaseRepository'
import { CURRENT_SEASON } from '@/lib/constants'
import { fetchCeutaForm, fetchTeamLogos } from '@/lib/serverFetches'

export const revalidate = 300 // refresca cada 5 min en vez de en cada visita

async function fetchStandings() {
  const service = new StandingsService(new StandingsSupabaseRepository())
  return service.getStandings(CURRENT_SEASON)
}

export default async function ClasificacionServerPage() {
  const [standings, form, logos] = await Promise.all([
    fetchStandings(),
    fetchCeutaForm(),
    fetchTeamLogos(),
  ])

  return <ClasificacionPage entries={standings?.entries ?? []} form={form} logos={logos} />
}
