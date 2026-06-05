import { supabase } from './client'
import { CURRENT_SEASON } from '@/lib/constants'

export interface TeamRecord {
  name: string
  shortName?: string
  logoUrl: string | null
  venue?: string | null
  season: string
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove accents
    .replace(/\b(fc|cf|ad|sd|ud|cd|rc|real|atletico|atletico|deportivo|balompie)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export class TeamsSupabaseRepository {
  async upsertTeams(teams: TeamRecord[]): Promise<void> {
    if (teams.length === 0) return

    const { error } = await supabase.from('teams').upsert(
      teams.map(t => ({
        name: t.name,
        short_name: t.shortName ?? null,
        logo_url: t.logoUrl,
        season: t.season,
      })),
      { onConflict: 'name,season' }
    )

    if (error) throw new Error(`Failed to upsert teams: ${error.message}`)
  }

  async getLogoByName(name: string, season = CURRENT_SEASON): Promise<string | null> {
    const { data } = await supabase
      .from('teams')
      .select('name, logo_url')
      .eq('season', season)

    if (!data || data.length === 0) return null

    const target = normalizeName(name)

    // Exact normalized match first
    const exact = data.find(t => normalizeName(t.name) === target)
    if (exact) return exact.logo_url

    // Partial match — target contains team name or vice versa
    const partial = data.find(t => {
      const n = normalizeName(t.name)
      return target.includes(n) || n.includes(target)
    })

    return partial?.logo_url ?? null
  }

  async getAllTeams(season = CURRENT_SEASON): Promise<TeamRecord[]> {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .eq('season', season)
      .order('name')

    return (data ?? []).map(row => ({
      name: row.name,
      shortName: row.short_name,
      logoUrl: row.logo_url,
      venue: row.venue ?? null,
      season: row.season,
    }))
  }
}
