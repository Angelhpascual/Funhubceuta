import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/PredictionRepository', () => ({
  getPredictionSeasonRanking: vi.fn(),
}))

import { getPredictionSeasonRanking } from '@/infrastructure/supabase/PredictionRepository'
import { GET } from '../route'

beforeEach(() => { vi.resetAllMocks() })

describe('GET /api/predictions/season', () => {
  it('returns ranking list', async () => {
    const ranking = [{ fingerprint: 'fp1', points: 65, exactos: 1, nickname: 'Tito' }]
    vi.mocked(getPredictionSeasonRanking).mockResolvedValue(ranking)

    const res = await GET()
    const body = await res.json()
    expect(body.ranking).toEqual(ranking)
  })

  it('returns empty array when no ranking', async () => {
    vi.mocked(getPredictionSeasonRanking).mockResolvedValue([])

    const res = await GET()
    const body = await res.json()
    expect(body.ranking).toEqual([])
  })
})
