import { supabase } from '@/infrastructure/supabase/client'
import { TeamsSupabaseRepository } from '@/infrastructure/supabase/TeamsSupabaseRepository'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { fetchSquadBySeason as _fetchSquadBySeason } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { fetchLeadersBySeason as _fetchLeadersBySeason, fetchPlayerStatsByName as _fetchPlayerStatsByName } from '@/infrastructure/supabase/PlayerStatsRepository'
import { fetchPlayerById as _fetchPlayerById } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { getTransfers as _getTransfers } from '@/infrastructure/supabase/TransfersRepository'
import { CURRENT_MATCH_SEASON, PREVIOUS_MATCH_SEASON, PREVIOUS_SEASON, STANDINGS_CURRENT_SEASON, STANDINGS_PREVIOUS_SEASON } from '@/lib/constants'

const matchesRepo = new MatchesSupabaseRepository()

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

export const fetchSquadBySeason = _fetchSquadBySeason
export const fetchLeadersBySeason = _fetchLeadersBySeason
export const fetchPlayerStatsByName = _fetchPlayerStatsByName
export const fetchPlayerById = _fetchPlayerById
export const getTransfers = _getTransfers

export async function fetchSeasonMatches(season: string = CURRENT_MATCH_SEASON) {
  return matchesRepo.fetchSeasonMatches(season)
}

export async function fetchPreviousSeasonMatches(season: string = PREVIOUS_MATCH_SEASON, limit = 200) {
  return matchesRepo.fetchBySeason(season, limit)
}

export async function fetchTeamLogos(): Promise<Record<string, string>> {
  const repo = new TeamsSupabaseRepository()
  const [s2425, s2526, s2627] = await Promise.all([
    repo.getAllTeams(PREVIOUS_SEASON),
    repo.getAllTeams(STANDINGS_PREVIOUS_SEASON),
    repo.getAllTeams(STANDINGS_CURRENT_SEASON),
  ])
  const map: Record<string, string> = {}
  // Oldest first so newest season overrides
  for (const t of s2425) if (t.logoUrl) map[t.name] = t.logoUrl
  for (const t of s2526) if (t.logoUrl) map[t.name] = t.logoUrl
  for (const t of s2627) if (t.logoUrl) map[t.name] = t.logoUrl
  return map
}
