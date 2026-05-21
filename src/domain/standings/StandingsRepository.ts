import { Standings, StandingEntry } from './Standings'

export interface StandingsRepository {
  getBySeason(season: string): Promise<Standings | null>
  upsertEntries(entries: Omit<StandingEntry, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void>
}
