import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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
  return new Request('http://localhost/api/cron/admin-prematch-reminder?test=true&secret=test-secret', { method: 'POST' })
}

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
  vi.mocked(notifyAdmin).mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('POST /api/cron/admin-prematch-reminder', () => {
  it('notifies when the next match is tomorrow', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-19T08:00:00Z')) // "today" Madrid = 2026-09-19
    mockGetNextMatch.mockResolvedValue({
      homeTeam: 'Ceuta', awayTeam: 'Real Valladolid', date: '2026-09-20', time: '16:15',
      weekday: 'Domingo', isHome: true, ticketsUrl: null, espnEventId: null,
    })

    const res = await POST(makeReq())
    const body = await res.json()

    expect(body.sent).toBe(true)
    expect(notifyAdmin).toHaveBeenCalledWith(
      '⏰ Partido mañana',
      'vs Real Valladolid a las 16:15. El live se activará solo ~15 min antes.'
    )
  })

  it('does nothing when the next match is not tomorrow', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-15T08:00:00Z'))
    mockGetNextMatch.mockResolvedValue({
      homeTeam: 'Ceuta', awayTeam: 'Real Valladolid', date: '2026-09-20', time: '16:15',
      weekday: 'Domingo', isHome: true, ticketsUrl: null, espnEventId: null,
    })

    const res = await POST(makeReq())
    const body = await res.json()

    expect(body.skipped).toBe('not-tomorrow')
    expect(notifyAdmin).not.toHaveBeenCalled()
  })

  it('skips when there is no upcoming match', async () => {
    mockGetNextMatch.mockResolvedValue(null)
    const res = await POST(makeReq())
    const body = await res.json()
    expect(body.skipped).toBe('no-upcoming-match')
    expect(notifyAdmin).not.toHaveBeenCalled()
  })
})
