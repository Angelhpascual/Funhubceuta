import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/MvpRepository', () => ({
  getMvpHistory: vi.fn(),
}))

import { getMvpHistory } from '@/infrastructure/supabase/MvpRepository'
import { GET } from '../route'

beforeEach(() => vi.resetAllMocks())

describe('GET /api/mvp/history', () => {
  it('returns history array', async () => {
    const history = [{ name: 'Marcos', wins: 3, votes: 120, photo_url: null }]
    vi.mocked(getMvpHistory).mockResolvedValue(history)

    const res = await GET(new Request('http://localhost/api/mvp/history'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.history).toEqual(history)
    expect(getMvpHistory).toHaveBeenCalledWith(3)
  })

  it('returns empty array when no history', async () => {
    vi.mocked(getMvpHistory).mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/mvp/history'))
    const body = await res.json()
    expect(body.history).toEqual([])
  })

  it('returns 500 on error', async () => {
    vi.mocked(getMvpHistory).mockRejectedValue(new Error('DB error'))
    const res = await GET(new Request('http://localhost/api/mvp/history'))
    expect(res.status).toBe(500)
  })
})
