import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/MatchesSupabaseRepository', () => {
  const fetchSeasonMatches = vi.fn()
  return {
    MatchesSupabaseRepository: class {
      fetchSeasonMatches = fetchSeasonMatches
      static __fetchSeasonMatches = fetchSeasonMatches
    },
  }
})
vi.mock('@/lib/constants', () => ({
  STANDINGS_CURRENT_SEASON: '2025-2026',
  CURRENT_SEASON: '2025-2026',
  CURRENT_MATCH_SEASON: '2026-2027',
}))

import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { GET } from '../all/route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetchSeasonMatches: ReturnType<typeof vi.fn> = (MatchesSupabaseRepository as any).__fetchSeasonMatches

beforeEach(() => { mockFetchSeasonMatches.mockReset() })

describe('GET /api/matches/all', () => {
  it('returns upcoming and results', async () => {
    mockFetchSeasonMatches.mockResolvedValue({
      upcoming: [{ date: '2026-06-01' }],
      results: [{ date: '2026-05-01', result: 'W' }],
    })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.upcoming).toHaveLength(1)
    expect(body.results).toHaveLength(1)
  })

  it('sets Cache-Control header', async () => {
    mockFetchSeasonMatches.mockResolvedValue({ upcoming: [], results: [] })
    const res = await GET()
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=300')
  })

  it('returns 500 when repo throws', async () => {
    mockFetchSeasonMatches.mockRejectedValue(new Error('network error'))
    const res = await GET()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('network error')
  })
})
