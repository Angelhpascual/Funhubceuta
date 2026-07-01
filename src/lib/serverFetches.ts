import { supabase } from '@/infrastructure/supabase/client'
import { TeamsSupabaseRepository } from '@/infrastructure/supabase/TeamsSupabaseRepository'
import { PREVIOUS_SEASON } from '@/lib/constants'

export async function fetchCeutaForm(): Promise<string[]> {
  const { data } = await supabase
    .from('matches')
    .select('result')
    .eq('status', 'finished')
    .not('result', 'is', null)
    .order('date', { ascending: false })
    .limit(5)
  if (data?.length) return data.map((m) => m.result as string).reverse()

  const { data: config } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'ceuta_form')
    .single()
  return config?.value?.split(',').filter(Boolean) ?? []
}

export async function fetchTeamLogos(): Promise<Record<string, string>> {
  const repo = new TeamsSupabaseRepository()
  const [current, previous] = await Promise.all([
    repo.getAllTeams(),
    repo.getAllTeams(PREVIOUS_SEASON),
  ])
  const map: Record<string, string> = {}
  // Previous season first so current season overrides on name collision
  for (const t of previous) if (t.logoUrl) map[t.name] = t.logoUrl
  for (const t of current) if (t.logoUrl) map[t.name] = t.logoUrl
  return map
}
