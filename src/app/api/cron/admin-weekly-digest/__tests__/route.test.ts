import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))
vi.mock('@/infrastructure/push/notifyAdmin', () => ({ notifyAdmin: vi.fn() }))
vi.mock('@/infrastructure/supabase/MatchesSupabaseRepository', () => {
  const getNextMatch = vi.fn()
  return {
    MatchesSupabaseRepository: class {
      getNextMatch = getNextMatch
      static __getNextMatch = getNextMatch
    },
  }
})

import { notifyAdmin } from '@/infrastructure/push/notifyAdmin'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { POST } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetNextMatch: ReturnType<typeof vi.fn> = (MatchesSupabaseRepository as any).__getNextMatch

function makeReq() {
  return new Request('http://localhost/api/cron/admin-weekly-digest?test=true&secret=test-secret', { method: 'POST' })
}

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
  vi.mocked(notifyAdmin).mockResolvedValue({ sent: 1, total: 1 })
})

describe('POST /api/cron/admin-weekly-digest', () => {
  it('sends a digest naming the rival, weekday and kickoff time', async () => {
    mockGetNextMatch.mockResolvedValue({
      homeTeam: 'Ceuta', awayTeam: 'Real Valladolid', date: '2026-09-20', time: '16:15',
      weekday: 'Domingo', isHome: true, ticketsUrl: null, espnEventId: null,
    })

    const res = await POST(makeReq())
    const body = await res.json()

    expect(body.sent).toBe(true)
    expect(notifyAdmin).toHaveBeenCalledWith(
      '📅 Esta semana',
      'vs Real Valladolid el Domingo 2026-09-20 a las 16:15. Revisa mercado/noticias si toca.'
    )
  })

  it('names the home team as rival when Ceuta plays away', async () => {
    mockGetNextMatch.mockResolvedValue({
      homeTeam: 'Burgos', awayTeam: 'Ceuta', date: '2026-09-11', time: '20:30',
      weekday: 'Viernes', isHome: false, ticketsUrl: null, espnEventId: null,
    })

    await POST(makeReq())

    expect(notifyAdmin).toHaveBeenCalledWith('📅 Esta semana', expect.stringContaining('vs Burgos'))
  })

  it('skips when there is no upcoming match', async () => {
    mockGetNextMatch.mockResolvedValue(null)
    const res = await POST(makeReq())
    const body = await res.json()
    expect(body.skipped).toBe('no-upcoming-match')
    expect(notifyAdmin).not.toHaveBeenCalled()
  })

  it('returns 401 with a wrong test secret', async () => {
    const req = new Request('http://localhost/api/cron/admin-weekly-digest?test=true&secret=wrong', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})
