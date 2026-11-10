import { Standings, StandingEntry } from '@/domain/standings/Standings'
import { StandingsRepository } from '@/domain/standings/StandingsRepository'
import { supabase } from './client'
import { supabaseAdmin } from './adminClient'

export class StandingsSupabaseRepository implements StandingsRepository {
  async getBySeason(season: string): Promise<Standings | null> {
    const { data, error } = await supabase
      .from('standings')
      .select('id, external_id, season, position, team_name, team_logo, played, won, drawn, lost, goals_for, goals_against, goal_difference, points, form, description, created_at, updated_at')
      .eq('season', season)
      .order('position', { ascending: true })

    if (error || !data || data.length === 0) return null

    return {
      season,
      entries: data.map(this.mapToEntity),
    }
  }

  async upsertEntries(
    entries: Omit<StandingEntry, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<void> {
    // updated_at has DEFAULT now() but no trigger, so it only ever gets set on
    // INSERT — an upsert that hits the ON CONFLICT (UPDATE) path left it frozen
    // at the row's original insert date forever, making "last synced" checks
    // on this column lie even when the cron ran successfully moments earlier.
    const { error } = await supabaseAdmin.from('standings').upsert(
      entries.map((e) => ({
        external_id: e.externalId,
        season: e.season,
        position: e.position,
        team_name: e.teamName,
        team_logo: e.teamLogo,
        played: e.played,
        won: e.won,
        drawn: e.drawn,
        lost: e.lost,
        goals_for: e.goalsFor,
        goals_against: e.goalsAgainst,
        goal_difference: e.goalDifference,
        points: e.points,
        form: e.form,
        description: e.description,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'external_id' }
    )

    if (error) throw new Error(`Failed to upsert standings: ${error.message}`)
  }

  private mapToEntity(row: Record<string, unknown>): StandingEntry {
    return {
      id: row.id as string,
      externalId: row.external_id as string,
      season: row.season as string,
      position: row.position as number,
      teamName: row.team_name as string,
      teamLogo: row.team_logo as string | null,
      played: row.played as number,
      won: row.won as number,
      drawn: row.drawn as number,
      lost: row.lost as number,
      goalsFor: row.goals_for as number,
      goalsAgainst: row.goals_against as number,
      goalDifference: row.goal_difference as number,
      points: row.points as number,
      form: row.form as string | null,
      description: row.description as string | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }
  }
}
