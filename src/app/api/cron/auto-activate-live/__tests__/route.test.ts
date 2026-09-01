import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))
vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({ getConfig: vi.fn() }))
vi.mock('@/infrastructure/live/activateLive', () => ({ activateLive: vi.fn() }))
vi.mock('@/infrastructure/supabase/MatchesSupabaseRepository', () => {
  const getNextMatch = vi.fn()
  return {
    MatchesSupabaseRepository: class {
      getNextMatch = getNextMatch
      static __getNextMatch = getNextMatch
    },
  }
})

import { getConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { activateLive } from '@/infrastructure/live/activateLive'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { POST } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetNextMatch: ReturnType<typeof vi.fn> = (MatchesSupabaseRepository as any).__getNextMatch

function makeReq() {
  return new Request('http://localhost/api/cron/auto-activate-live?test=true&secret=test-secret', { method: 'POST' })
}

function makeMatch(overrides: Record<string, unknown> = {}) {
  return {
    homeTeam: 'Ceuta', awayTeam: 'Real Valladolid',
    date: '2026-09-20', time: '18:30',
    weekday: 'Domingo', isHome: true, ticketsUrl: null, espnEventId: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
  vi.mocked(getConfig).mockResolvedValue(null)
  vi.mocked(activateLive).mockResolvedValue({ ok: true, scheduleId: 'sch_123' })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('POST /api/cron/auto-activate-live', () => {
  it('skips when live is already active', async () => {
    vi.mocked(getConfig).mockResolvedValue('true')
    const res = await POST(makeReq())
    const body = await res.json()
    expect(body.skipped).toBe('already-active')
    expect(activateLive).not.toHaveBeenCalled()
  })

  it('skips when there is no upcoming match', async () => {
    mockGetNextMatch.mockResolvedValue(null)
    const res = await POST(makeReq())
    const body = await res.json()
    expect(body.skipped).toBe('no-upcoming-match')
    expect(activateLive).not.toHaveBeenCalled()
  })

  it('activates when kickoff is within the pre-match window (CEST, UTC+2)', async () => {
    // 2026-09-20 18:30 Madrid local (CEST) = 16:30 UTC. Set "now" 10 min before.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-20T16:20:00Z'))
    mockGetNextMatch.mockResolvedValue(makeMatch({ date: '2026-09-20', time: '18:30' }))

    const res = await POST(makeReq())
    const body = await res.json()

    expect(activateLive).toHaveBeenCalledTimes(1)
    expect(body.activated).toBe(true)
    expect(body.scheduleId).toBe('sch_123')
  })

  it('does not activate when kickoff is hours away', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-20T10:00:00Z'))
    mockGetNextMatch.mockResolvedValue(makeMatch({ date: '2026-09-20', time: '18:30' }))

    const res = await POST(makeReq())
    const body = await res.json()

    expect(activateLive).not.toHaveBeenCalled()
    expect(body.skipped).toBe('outside-window')
  })

  it('does not activate long after kickoff (safety window expired)', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-20T20:00:00Z')) // kickoff (16:30Z) + 3h30
    mockGetNextMatch.mockResolvedValue(makeMatch({ date: '2026-09-20', time: '18:30' }))

    const res = await POST(makeReq())
    const body = await res.json()

    expect(activateLive).not.toHaveBeenCalled()
    expect(body.skipped).toBe('outside-window')
  })

  it('returns 401 with a wrong test secret', async () => {
    const req = new Request('http://localhost/api/cron/auto-activate-live?test=true&secret=wrong', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})
