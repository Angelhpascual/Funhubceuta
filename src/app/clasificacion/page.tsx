import { ClasificacionPage } from '@/features/standings/ClasificacionPage'
import { StandingsService } from '@/domain/standings/StandingsService'
import { StandingsSupabaseRepository } from '@/infrastructure/supabase/StandingsSupabaseRepository'
import { TeamsSupabaseRepository } from '@/infrastructure/supabase/TeamsSupabaseRepository'
import { supabase } from '@/infrastructure/supabase/client'
import { CURRENT_SEASON } from '@/lib/constants'

export const revalidate = 300 // 5 min cache en el edge

async function fetchStandings() {
  const service = new StandingsService(new StandingsSupabaseRepository())
  return service.getStandings(CURRENT_SEASON)
}

async function fetchForm(): Promise<string[]> {
  const { data } = await supabase
    .from('matches')
    .select('result')
    .eq('status', 'finished')
    .not('result', 'is', null)
    .order('date', { ascending: false })
    .limit(5)
  if (data?.length) return data.map(m => m.result).reverse()

  const { data: config } = await supabase
    .from('app_config').select('value').eq('key', 'ceuta_form').single()
  return config?.value?.split(',').filter(Boolean) ?? []
}

async function fetchLogos(): Promise<Record<string, string>> {
  const repo = new TeamsSupabaseRepository()
  const teams = await repo.getAllTeams()
  const map: Record<string, string> = {}
  for (const t of teams) if (t.logoUrl) map[t.name] = t.logoUrl
  return map
}

export default async function ClasificacionServerPage() {
  const [standings, form, logos] = await Promise.all([
    fetchStandings(),
    fetchForm(),
    fetchLogos(),
  ])

  return (
    <ClasificacionPage
      initialEntries={standings?.entries ?? []}
      initialForm={form}
      initialLogos={logos}
    />
  )
}
