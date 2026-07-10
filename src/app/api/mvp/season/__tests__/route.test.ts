import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/MvpRepository', () => ({
  getMvpSeasonRanking: vi.fn(),
}))

import { getMvpSeasonRanking } from '@/infrastructure/supabase/MvpRepository'
import { GET } from '../route'

beforeEach(() => { vi.resetAllMocks() })

describe('GET /api/mvp/season', () => {
  it('returns ranking', async () => {
    const ranking = [{ name: 'Top Player', wins: 3, votes: 15, photo_url: null }]
    vi.mocked(getMvpSeasonRanking).mockResolvedValue(ranking)

    const body = await (await GET()).json()
    expect(body.ranking).toEqual(ranking)
  })

  it('returns empty ranking', async () => {
    vi.mocked(getMvpSeasonRanking).mockResolvedValue([])
    const body = await (await GET()).json()
    expect(body.ranking).toEqual([])
  })
})
