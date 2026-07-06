import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))
vi.mock('@/infrastructure/supabase/PlayerStatsRepository', () => ({ upsertPlayerStats: vi.fn() }))
vi.mock('@/lib/constants', () => ({ ESPN_ROSTER: 'https://espn.com/roster', CURRENT_SEASON: '2025-2026' }))
vi.mock('@upstash/qstash', () => {
  const verify = vi.fn()
  return {
    Receiver: class {
      verify = verify
      static __verify = verify
    },
  }
})

import { upsertPlayerStats } from '@/infrastructure/supabase/PlayerStatsRepository'
import { logCron } from '@/infrastructure/supabase/logCron'
import { Receiver } from '@upstash/qstash'
import { GET, POST } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockVerify: ReturnType<typeof vi.fn> = (Receiver as any).__verify

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
})

const espnAthlete = {
  id: '123',
  displayName: 'Jugador Test',
  shortName: 'J. Test',
  position: { abbreviation: 'F', displayName: 'Forward' },
  headshot: { href: 'https://espn.com/photo.jpg' },
  statistics: {
    splits: {
      categories: [
        { name: 'general', stats: [
          { name: 'appearances', value: 20 },
          { name: 'totalGoals', value: 5 },
          { name: 'goalAssists', value: 3 },
          { name: 'totalShots', value: 30 },
          { name: 'shotsOnTarget', value: 10 },
          { name: 'yellowCards', value: 2 },
          { name: 'redCards', value: 0 },
          { name: 'saves', value: 0 },
          { name: 'goalsConceded', value: 0 },
        ]},
      ],
    },
  },
}

function mockEspnFetch(athletes: unknown[]) {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ athletes }), { status: 200 })
  )
}

describe('cron/player-stats GET', () => {
  it('returns 401 in production without secret', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = await GET(new Request('http://localhost/api/cron/player-stats'))
    expect(res.status).toBe(401)
    vi.unstubAllEnvs()
  })

  it('scrapes ESPN and upserts stats', async () => {
    mockEspnFetch([espnAthlete])
    vi.mocked(upsertPlayerStats).mockResolvedValue(undefined)
    vi.mocked(logCron).mockResolvedValue(undefined)

    const res = await GET(new Request('http://localhost/api/cron/player-stats'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.updated).toBe(1)
    expect(upsertPlayerStats).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ espn_id: '123', goals: 5 })])
    )
  })

  it('returns 200 with updated=0 when ESPN returns no athletes with stats yet', async () => {
    mockEspnFetch([])
    vi.mocked(logCron).mockResolvedValue(undefined)

    const res = await GET(new Request('http://localhost/api/cron/player-stats'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.updated).toBe(0)
    expect(upsertPlayerStats).not.toHaveBeenCalled()
    expect(logCron).toHaveBeenCalledWith('player-stats', 'success', expect.any(Number),
      expect.objectContaining({ updated: 0, warning: expect.any(String) })
    )
  })

  it('returns 500 on ESPN HTTP failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('', { status: 503 }))
    vi.mocked(logCron).mockResolvedValue(undefined)

    const res = await GET(new Request('http://localhost/api/cron/player-stats'))
    expect(res.status).toBe(500)
    expect(logCron).toHaveBeenCalledWith('player-stats', 'error', expect.any(Number), expect.any(Object))
  })
})

describe('cron/player-stats POST', () => {
  it('returns 401 for invalid QStash signature', async () => {
    mockVerify.mockRejectedValue(new Error('bad'))
    const res = await POST(new Request('http://localhost/api/cron/player-stats', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(401)
  })

  it('bypasses QStash with TEST_SECRET', async () => {
    mockEspnFetch([espnAthlete])
    vi.mocked(upsertPlayerStats).mockResolvedValue(undefined)
    vi.mocked(logCron).mockResolvedValue(undefined)

    const res = await POST(new Request('http://localhost/api/cron/player-stats?secret=test-secret', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(200)
    expect(mockVerify).not.toHaveBeenCalled()
  })
})
