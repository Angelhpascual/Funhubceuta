import { Standings, StandingEntry } from './Standings'
import { StandingsRepository } from './StandingsRepository'
import { scrapeStandings } from '@/infrastructure/football-api/laligaScraper'

export class StandingsService {
  constructor(private readonly repository: StandingsRepository) {}

  async getStandings(season: string): Promise<Standings | null> {
    const cached = await this.repository.getBySeason(season)
    if (cached) return cached

    // Don't scrape during build (no Chrome available in Vercel build environment)
    if (process.env.NEXT_PHASE === 'phase-production-build') return null

    return this.syncFromApi(season)
  }

  async syncFromApi(season: string): Promise<Standings | null> {
    const entries = await scrapeStandings(season)

    if (!entries || entries.length === 0) return null

    await this.repository.upsertEntries(entries)

    return {
      season,
      entries: entries as StandingEntry[],
    }
  }
}
