import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/supabase/MvpRepository', () => ({
  getMvpSeasonRanking: vi.fn(),
}))
vi.mock('@/infrastructure/supabase/adminClient', () => ({
  supabaseAdmin: { from: vi.fn() },
}))
vi.mock('@/lib/appEnv', () => ({ APP_ENV: 'development' }))

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { getMvpSeasonRanking } from '@/infrastructure/supabase/MvpRepository'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { GET } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
  vi.mocked(getMvpSeasonRanking).mockResolvedValue([])
})

function mockFrom(sessions: unknown[], events: unknown[]) {
  vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
    if (table === 'mvp_sessions') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: sessions }),
        }),
      } as never
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: events }),
      }),
    } as never
  })
}

describe('GET /api/admin/mvp/analytics', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await GET(new Request('http://localhost'))
    expect(res.status).toBe(401)
  })

  it('returns sessions with analytics aggregates', async () => {
    const session = { id: 's1', match_label: 'Ceuta vs Rival', status: 'closed', winner_name: 'Marcos', winner_votes: 5, opened_at: null, closed_at: null }
    const events = [
      { session_id: 's1', event: 'banner_click', fingerprint: 'fp1', created_at: '2026-05-01T20:00:00Z' },
      { session_id: 's1', event: 'sheet_open', fingerprint: 'fp1', created_at: '2026-05-01T20:01:00Z' },
      { session_id: 's1', event: 'vote_cast', fingerprint: 'fp1', created_at: '2026-05-01T20:02:00Z' },
      { session_id: 's1', event: 'vote_cast', fingerprint: 'fp2', created_at: '2026-05-01T20:03:00Z' },
    ]
    mockFrom([session], events)

    const res = await GET(new Request('http://localhost'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sessions).toHaveLength(1)
    const s = body.sessions[0]
    expect(s.clicks).toBe(1)
    expect(s.opens).toBe(1)
    expect(s.voteCasts).toBe(2)
    expect(s.uniqueVoters).toBe(2)
    expect(s.suspicious).toBe(false)
  })

  it('returns empty sessions when none', async () => {
    mockFrom([], [])
    const res = await GET(new Request('http://localhost'))
    const body = await res.json()
    expect(body.sessions).toEqual([])
  })

  it('returns 500 on error', async () => {
    vi.mocked(supabaseAdmin.from).mockImplementation(() => {
      throw new Error('DB error')
    })
    const res = await GET(new Request('http://localhost'))
    expect(res.status).toBe(500)
  })
})
