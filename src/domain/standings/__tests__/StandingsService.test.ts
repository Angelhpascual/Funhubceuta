import { describe, it, expect, vi } from 'vitest'
import { StandingsService } from '../StandingsService'
import type { StandingsRepository } from '../StandingsRepository'

function makeRepo(getBySeason: ReturnType<typeof vi.fn>): StandingsRepository {
  return { getBySeason, upsertEntries: vi.fn() } as unknown as StandingsRepository
}

describe('StandingsService.getStandings', () => {
  it('returns whatever the repository has cached, without triggering a live scrape', async () => {
    const standings = { season: '2025-2026', entries: [] }
    const getBySeason = vi.fn().mockResolvedValue(standings)
    const service = new StandingsService(makeRepo(getBySeason))

    const result = await service.getStandings('2025-2026')

    expect(result).toBe(standings)
    expect(getBySeason).toHaveBeenCalledWith('2025-2026')
  })

  it('returns null on a cache miss (regression: this used to fall through to a live Puppeteer scrape, a second uncoordinated writer to the same table as the ESPN cron sync)', async () => {
    const getBySeason = vi.fn().mockResolvedValue(null)
    const service = new StandingsService(makeRepo(getBySeason))

    const result = await service.getStandings('2025-2026')

    expect(result).toBeNull()
  })
})
