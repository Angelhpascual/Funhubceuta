import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/TweetsRepository', () => ({
  getLatestTweets: vi.fn(),
}))

import { getLatestTweets } from '@/infrastructure/supabase/TweetsRepository'
import { GET } from '../route'

beforeEach(() => { vi.resetAllMocks() })

describe('GET /api/tweets', () => {
  it('returns tweets array', async () => {
    vi.mocked(getLatestTweets).mockResolvedValue([
      { id: '1', text: 'Gol de Ceuta!', createdAt: '2026-05-01', url: 'https://x.com/1' },
    ])
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.tweets).toHaveLength(1)
    expect(body.tweets[0].text).toBe('Gol de Ceuta!')
  })

  it('returns empty array when no tweets', async () => {
    vi.mocked(getLatestTweets).mockResolvedValue([])
    const res = await GET()
    const body = await res.json()
    expect(body.tweets).toEqual([])
  })

  it('sets Cache-Control header', async () => {
    vi.mocked(getLatestTweets).mockResolvedValue([])
    const res = await GET()
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=300')
  })

  it('returns 500 when repo throws', async () => {
    vi.mocked(getLatestTweets).mockRejectedValue(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
