import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/supabase/adminClient', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { GET } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
})

// sessions query: .eq.eq.order.limit
// ranking query:  .eq.eq.not
// votes query:    .in.order
function mockFrom(sessions: unknown[], votes: unknown[]) {
  let callCount = 0
  vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
    if (table === 'mvp_sessions') {
      callCount++
      if (callCount === 1) {
        // First call: history sessions — ends in .limit()
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: sessions }),
            not: vi.fn().mockResolvedValue({ data: sessions }),
          }),
        } as never
      }
      // Second call: ranking sessions — ends in .not()
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockResolvedValue({ data: sessions }),
        }),
      } as never
    }
    // mvp_votes
    return {
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: votes }),
        }),
      }),
    } as never
  })
}

describe('GET /api/admin/mvp/history', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns history and seasonRanking', async () => {
    const session = {
      id: 's1', match_label: 'Ceuta vs Rival', winner_name: 'Marcos',
      winner_votes: 120, closed_at: '2026-05-01',
      candidates: [{ id: 'c1', name: 'Marcos', number: 9, position: 'DEL' }],
    }
    const vote = { session_id: 's1', candidate_id: 'c1', fingerprint: 'fp123', created_at: '2026-05-01T20:00:00Z' }
    mockFrom([session], [vote])

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.history).toHaveLength(1)
    expect(body.history[0].votes[0].candidate_name).toBe('Marcos')
    expect(body.seasonRanking).toHaveLength(1)
    expect(body.seasonRanking[0].name).toBe('Marcos')
    expect(body.seasonRanking[0].wins).toBe(1)
  })

  it('returns empty history when no sessions', async () => {
    mockFrom([], [])
    const res = await GET()
    const body = await res.json()
    expect(body.history).toEqual([])
    expect(body.seasonRanking).toEqual([])
  })

  it('returns 500 on error', async () => {
    vi.mocked(supabaseAdmin.from).mockImplementation(() => {
      throw new Error('DB error')
    })
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
