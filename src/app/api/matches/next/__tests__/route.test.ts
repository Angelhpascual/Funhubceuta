import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetNextMatch = vi.hoisted(() => vi.fn())

vi.mock('@/infrastructure/supabase/MatchesSupabaseRepository', () => {
  function MatchesSupabaseRepository(this: { getNextMatch: typeof mockGetNextMatch }) {
    this.getNextMatch = mockGetNextMatch
  }
  return { MatchesSupabaseRepository }
})

import { GET } from '../route'

beforeEach(() => vi.resetAllMocks())

describe('GET /api/matches/next', () => {
  it('returns the next match', async () => {
    const match = { id: '1', home_team: 'AD Ceuta FC', away_team: 'FC Andorra', date: '2026-09-01' }
    mockGetNextMatch.mockResolvedValue(match)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.match).toEqual(match)
  })

  it('returns null match when none found', async () => {
    mockGetNextMatch.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.match).toBeNull()
  })

  it('returns 500 on error', async () => {
    mockGetNextMatch.mockRejectedValue(new Error('DB down'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
