import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/MatchesSupabaseRepository', () => {
  const getNextMatch = vi.fn()
  return {
    MatchesSupabaseRepository: class {
      getNextMatch = getNextMatch
      static __getNextMatch = getNextMatch
    },
  }
})

import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { GET } from '../next/route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetNextMatch: ReturnType<typeof vi.fn> = (MatchesSupabaseRepository as any).__getNextMatch

beforeEach(() => { mockGetNextMatch.mockReset() })

describe('GET /api/matches/next', () => {
  it('returns match when found', async () => {
    mockGetNextMatch.mockResolvedValue({ homeTeam: 'Ceuta', awayTeam: 'Madrid', date: '2026-06-10' })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.match.homeTeam).toBe('Ceuta')
  })

  it('returns match: null when no upcoming match', async () => {
    mockGetNextMatch.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.match).toBeNull()
  })

  it('sets Cache-Control header', async () => {
    mockGetNextMatch.mockResolvedValue(null)
    const res = await GET()
    expect(res.headers.get('Cache-Control')).toContain('no-cache')
  })

  it('returns 500 when repo throws', async () => {
    mockGetNextMatch.mockRejectedValue(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
