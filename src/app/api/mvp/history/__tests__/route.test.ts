import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/MvpRepository', () => ({
  getMvpHistory: vi.fn(),
}))

import { getMvpHistory } from '@/infrastructure/supabase/MvpRepository'
import { GET } from '../route'

beforeEach(() => vi.resetAllMocks())

describe('GET /api/mvp/history', () => {
  it('returns history array', async () => {
    const history = [{ id: 's1', match_label: 'Ceuta vs Rival', winner_name: 'Marcos', winner_votes: 120, closed_at: '2026-05-01' }]
    vi.mocked(getMvpHistory).mockResolvedValue(history as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.history).toEqual(history)
    expect(getMvpHistory).toHaveBeenCalledWith(3)
  })

  it('returns empty array when no history', async () => {
    vi.mocked(getMvpHistory).mockResolvedValue([])
    const res = await GET()
    const body = await res.json()
    expect(body.history).toEqual([])
  })

  it('returns 500 on error', async () => {
    vi.mocked(getMvpHistory).mockRejectedValue(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
