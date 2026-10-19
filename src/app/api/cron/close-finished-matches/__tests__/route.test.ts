import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))
vi.mock('@upstash/qstash', () => {
  const verify = vi.fn()
  return { Receiver: class { verify = verify; static __verify = verify } }
})
const { fetchUnfinishedPast, markMatchFinished, fetchRecentForm } = vi.hoisted(() => ({
  fetchUnfinishedPast: vi.fn().mockResolvedValue([]),
  markMatchFinished: vi.fn().mockResolvedValue(undefined),
  fetchRecentForm: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/infrastructure/supabase/MatchesSupabaseRepository', () => ({
  MatchesSupabaseRepository: function () { return { fetchUnfinishedPast, markMatchFinished, fetchRecentForm } },
}))
vi.mock('@/infrastructure/espn/fetchMatchResult', () => ({ fetchEspnMatchResult: vi.fn() }))
vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({ setConfig: vi.fn() }))

import { logCron } from '@/infrastructure/supabase/logCron'
import { Receiver } from '@upstash/qstash'
import { fetchEspnMatchResult } from '@/infrastructure/espn/fetchMatchResult'
import { GET, POST } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockVerify: ReturnType<typeof vi.fn> = (Receiver as any).__verify

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
  fetchUnfinishedPast.mockResolvedValue([])
  fetchRecentForm.mockResolvedValue([])
})

describe('cron/close-finished-matches GET', () => {
  it('returns 405 in production without secret', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = await GET(new NextRequest('http://localhost/api/cron/close-finished-matches'))
    expect(res.status).toBe(405)
    vi.unstubAllEnvs()
  })

  it('closes a match that is scheduled today once ESPN reports it post (regression: cron/matches alone used to wait up to a week for the same result)', async () => {
    fetchUnfinishedPast.mockResolvedValue([
      { espnEventId: '401883179', homeTeam: 'Ceuta', awayTeam: 'Real Oviedo' },
    ])
    vi.mocked(fetchEspnMatchResult).mockResolvedValue({
      state: 'post', homeTeam: 'Ceuta', awayTeam: 'Real Oviedo', homeScore: 1, awayScore: 2,
    })

    const res = await GET(new NextRequest('http://localhost/api/cron/close-finished-matches'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(markMatchFinished).toHaveBeenCalledWith('401883179', 1, 2, 'L')
    expect(body.closedViaEspn).toEqual(['401883179'])
  })

  it('logs error and rethrows on failure', async () => {
    fetchUnfinishedPast.mockRejectedValue(new Error('db down'))
    await expect(GET(new NextRequest('http://localhost/api/cron/close-finished-matches'))).rejects.toThrow('db down')
    expect(logCron).toHaveBeenCalledWith('close-finished-matches', 'error', expect.any(Number), expect.objectContaining({ error: expect.any(String) }))
  })
})

describe('cron/close-finished-matches POST', () => {
  it('returns 401 for invalid QStash signature', async () => {
    mockVerify.mockRejectedValue(new Error('bad sig'))
    const res = await POST(new NextRequest('http://localhost/api/cron/close-finished-matches', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(401)
  })

  it('bypasses QStash with TEST_SECRET', async () => {
    const res = await POST(new NextRequest('http://localhost/api/cron/close-finished-matches?secret=test-secret', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(200)
    expect(mockVerify).not.toHaveBeenCalled()
  })
})
