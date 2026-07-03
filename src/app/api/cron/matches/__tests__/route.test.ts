import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))
vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({ setConfig: vi.fn() }))
vi.mock('@/infrastructure/scrapers/adceutaScraper', () => ({
  scrapeNextMatches: vi.fn(),
  scrapeRecentForm: vi.fn(),
  scrapeRecentResults: vi.fn(),
}))
vi.mock('@upstash/qstash', () => {
  const verify = vi.fn()
  return {
    Receiver: class {
      verify = verify
      static __verify = verify
    },
  }
})
vi.mock('@/infrastructure/supabase/MatchesSupabaseRepository', () => {
  const upsertMatches = vi.fn()
  const upsertResults = vi.fn()
  return {
    MatchesSupabaseRepository: class {
      upsertMatches = upsertMatches
      upsertResults = upsertResults
      static __upsertMatches = upsertMatches
      static __upsertResults = upsertResults
    },
  }
})

import { scrapeNextMatches, scrapeRecentForm, scrapeRecentResults } from '@/infrastructure/scrapers/adceutaScraper'
import { setConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { logCron } from '@/infrastructure/supabase/logCron'
import { Receiver } from '@upstash/qstash'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { GET, POST } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpsertMatches: ReturnType<typeof vi.fn> = (MatchesSupabaseRepository as any).__upsertMatches
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpsertResults: ReturnType<typeof vi.fn> = (MatchesSupabaseRepository as any).__upsertResults
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockVerify: ReturnType<typeof vi.fn> = (Receiver as any).__verify

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
})

describe('cron/matches GET', () => {
  it('returns 405 in production without secret', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = await GET(new Request('http://localhost/api/cron/matches'))
    expect(res.status).toBe(405)
    vi.unstubAllEnvs()
  })

  it('syncs matches and returns result', async () => {
    vi.mocked(scrapeNextMatches).mockResolvedValue([{ homeTeam: 'Ceuta', awayTeam: 'Madrid', date: '2026-06-01', time: '18:00', weekday: 'Lunes', isHome: true, ticketsUrl: null, espnEventId: null }])
    vi.mocked(scrapeRecentForm).mockResolvedValue(['W', 'D'])
    vi.mocked(scrapeRecentResults).mockResolvedValue([])
    mockUpsertMatches.mockResolvedValue(undefined)
    mockUpsertResults.mockResolvedValue(undefined)
    vi.mocked(setConfig).mockResolvedValue(undefined)
    vi.mocked(logCron).mockResolvedValue(undefined)

    const res = await GET(new Request('http://localhost/api/cron/matches'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.count.matches).toBe(1)
  })

  it('saves form to config when form is non-empty', async () => {
    vi.mocked(scrapeNextMatches).mockResolvedValue([])
    vi.mocked(scrapeRecentForm).mockResolvedValue(['W', 'W', 'L'])
    vi.mocked(scrapeRecentResults).mockResolvedValue([])
    mockUpsertMatches.mockResolvedValue(undefined)
    mockUpsertResults.mockResolvedValue(undefined)
    vi.mocked(setConfig).mockResolvedValue(undefined)
    vi.mocked(logCron).mockResolvedValue(undefined)

    await GET(new Request('http://localhost/api/cron/matches'))
    expect(setConfig).toHaveBeenCalledWith('ceuta_form', 'W,W,L')
  })

  it('logs error and rethrows on failure', async () => {
    vi.mocked(scrapeNextMatches).mockRejectedValue(new Error('ESPN down'))
    vi.mocked(scrapeRecentForm).mockResolvedValue([])
    vi.mocked(scrapeRecentResults).mockResolvedValue([])
    vi.mocked(logCron).mockResolvedValue(undefined)

    await expect(GET(new Request('http://localhost/api/cron/matches'))).rejects.toThrow('ESPN down')
    expect(logCron).toHaveBeenCalledWith('matches', 'error', expect.any(Number), expect.objectContaining({ error: expect.any(String) }))
  })
})

describe('cron/matches POST', () => {
  it('returns 401 for invalid signature', async () => {
    mockVerify.mockRejectedValue(new Error('bad sig'))
    const res = await POST(new Request('http://localhost/api/cron/matches', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(401)
  })

  it('bypasses QStash with TEST_SECRET', async () => {
    vi.mocked(scrapeNextMatches).mockResolvedValue([])
    vi.mocked(scrapeRecentForm).mockResolvedValue([])
    vi.mocked(scrapeRecentResults).mockResolvedValue([])
    mockUpsertMatches.mockResolvedValue(undefined)
    mockUpsertResults.mockResolvedValue(undefined)
    vi.mocked(logCron).mockResolvedValue(undefined)

    const res = await POST(new Request('http://localhost/api/cron/matches?secret=test-secret', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(200)
    expect(mockVerify).not.toHaveBeenCalled()
  })
})
