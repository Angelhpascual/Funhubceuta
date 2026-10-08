import { Standings } from './Standings'
import { StandingsRepository } from './StandingsRepository'

export class StandingsService {
  constructor(private readonly repository: StandingsRepository) {}

  // The ESPN-backed sync (src/app/api/standings/sync/route.ts, run on a
  // schedule and from the admin panel) is the sole writer for this data —
  // this used to fall back to a live Puppeteer scrape of laligaweb on a
  // cache miss, a second, uncoordinated writer to the same rows that could
  // launch headless Chrome inside a public, user-facing request. Removed:
  // a cold cache now just means "the scheduled sync hasn't run yet", same
  // as any other cron-fed table in this app.
  async getStandings(season: string): Promise<Standings | null> {
    return this.repository.getBySeason(season)
  }
}
