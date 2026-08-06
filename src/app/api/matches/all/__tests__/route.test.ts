import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetchSeasonMatches = vi.hoisted(() => vi.fn())

vi.mock('@/infrastructure/supabase/MatchesSupabaseRepository', () => {
  function MatchesSupabaseRepository(this: { fetchSeasonMatches: typeof mockFetchSeasonMatches }) {
    this.fetchSeasonMatches = mockFetchSeasonMatches
  }
  return { MatchesSupabaseRepository }
})
vi.mock('@/lib/constants', () => ({ CURRENT_MATCH_SEASON: '2026-27' }))

import { GET } from '../route'

beforeEach(() => vi.resetAllMocks())

describe('GET /api/matches/all', () => {
  it('returns upcoming and results', async () => {
    const data = { upcoming: [{ id: '1' }], results: [{ id: '2' }] }
    mockFetchSeasonMatches.mockResolvedValue(data)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.upcoming).toEqual(data.upcoming)
    expect(body.results).toEqual(data.results)
    expect(mockFetchSeasonMatches).toHaveBeenCalledWith('2026-27')
  })

  it('returns 500 on error', async () => {
    mockFetchSeasonMatches.mockRejectedValue(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
