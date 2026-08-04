import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/supabase/PredictionRepository', () => ({
  getPredictionHistory: vi.fn(),
  getPredictionSeasonRanking: vi.fn(),
}))

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { getPredictionHistory, getPredictionSeasonRanking } from '@/infrastructure/supabase/PredictionRepository'
import { GET } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
  vi.mocked(getPredictionSeasonRanking).mockResolvedValue([])
})

describe('GET /api/admin/predictions/history', () => {
  it('returns history list', async () => {
    const history = [
      {
        id: 's1',
        match_label: 'Ceuta vs X',
        jornada: 'J20',
        result: { home: 2, away: 1 },
        closed_at: '2026-01-01',
        votes: [{ nickname: 'Tito', fingerprint: 'fp1', home_score: 2, away_score: 1, points: 50 }],
      },
    ]
    vi.mocked(getPredictionHistory).mockResolvedValue(history)

    const res = await GET()
    const body = await res.json()
    expect(body.history).toEqual(history)
  })

  it('returns empty array when no history', async () => {
    vi.mocked(getPredictionHistory).mockResolvedValue([])

    const res = await GET()
    const body = await res.json()
    expect(body.history).toEqual([])
  })
})
