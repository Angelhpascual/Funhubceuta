import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/PlayerStatsRepository', () => ({
  fetchLeadersBySeason: vi.fn(),
}))
vi.mock('@/lib/constants', () => ({ CURRENT_SEASON: '2026-27' }))

import { fetchLeadersBySeason } from '@/infrastructure/supabase/PlayerStatsRepository'
import { GET } from '../route'

beforeEach(() => vi.resetAllMocks())

describe('GET /api/stats/player-leaders', () => {
  it('returns leaders for current season', async () => {
    const leaders = [{ name: 'Marcos', goals: 5, assists: 2 }]
    vi.mocked(fetchLeadersBySeason).mockResolvedValue(leaders as never)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.leaders).toEqual(leaders)
    expect(fetchLeadersBySeason).toHaveBeenCalledWith('2026-27')
  })

  it('returns 500 on error', async () => {
    vi.mocked(fetchLeadersBySeason).mockRejectedValue(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
