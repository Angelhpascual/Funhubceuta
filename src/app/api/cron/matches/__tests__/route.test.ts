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
  const fetchUnfinishedPast = vi.fn().mockResolvedValue([])
  const markMatchFinished = vi.fn()
  const fetchRecentForm = vi.fn().mockResolvedValue([])
  return {
    MatchesSupabaseRepository: class {
      upsertMatches = upsertMatches
      upsertResults = upsertResults
      fetchUnfinishedPast = fetchUnfinishedPast
      markMatchFinished = markMatchFinished
      fetchRecentForm = fetchRecentForm
      static __upsertMatches = upsertMatches
      static __upsertResults = upsertResults
      static __fetchUnfinishedPast = fetchUnfinishedPast
      static __markMatchFinished = markMatchFinished
      static __fetchRecentForm = fetchRecentForm
    },
  }
})
vi.mock('@/infrastructure/espn/fetchMatchResult', () => ({ fetchEspnMatchResult: vi.fn() }))

import { scrapeNextMatches, scrapeRecentForm, scrapeRecentResults } from '@/infrastructure/scrapers/adceutaScraper'
import { setConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { logCron } from '@/infrastructure/supabase/logCron'
import { Receiver } from '@upstash/qstash'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { fetchEspnMatchResult } from '@/infrastructure/espn/fetchMatchResult'
import { GET, POST } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpsertMatches: ReturnType<typeof vi.fn> = (MatchesSupabaseRepository as any).__upsertMatches
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpsertResults: ReturnType<typeof vi.fn> = (MatchesSupabaseRepository as any).__upsertResults
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetchUnfinishedPast: ReturnType<typeof vi.fn> = (MatchesSupabaseRepository as any).__fetchUnfinishedPast
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockMarkMatchFinished: ReturnType<typeof vi.fn> = (MatchesSupabaseRepository as any).__markMatchFinished
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetchRecentForm: ReturnType<typeof vi.fn> = (MatchesSupabaseRepository as any).__fetchRecentForm
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockVerify: ReturnType<typeof vi.fn> = (Receiver as any).__verify

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
  mockFetchUnfinishedPast.mockResolvedValue([])
  mockFetchRecentForm.mockResolvedValue([])
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

describe('closeFinishedMatchesFromEspn (via syncMatches)', () => {
  beforeEach(() => {
    vi.mocked(scrapeNextMatches).mockResolvedValue([])
    vi.mocked(scrapeRecentForm).mockResolvedValue([])
    vi.mocked(scrapeRecentResults).mockResolvedValue([])
    mockUpsertMatches.mockResolvedValue(undefined)
    mockUpsertResults.mockResolvedValue(undefined)
    vi.mocked(setConfig).mockResolvedValue(undefined)
    vi.mocked(logCron).mockResolvedValue(undefined)
  })

  it('closes a stale scheduled match once ESPN reports it as post, computing the correct W/L/D from Ceuta\'s side', async () => {
    mockFetchUnfinishedPast.mockResolvedValue([
      { espnEventId: '401883162', homeTeam: 'Castellón', awayTeam: 'Ceuta' },
    ])
    vi.mocked(fetchEspnMatchResult).mockResolvedValue({
      state: 'post', homeTeam: 'Castellón', awayTeam: 'Ceuta', homeScore: 1, awayScore: 1,
    })

    const res = await GET(new Request('http://localhost/api/cron/matches'))
    const body = await res.json()

    expect(mockMarkMatchFinished).toHaveBeenCalledWith('401883162', 1, 1, 'D')
    expect(body.count.closedViaEspn).toEqual(['401883162'])
  })

  it('does not close a match ESPN still reports as pre/in (regression: a match stuck scheduled should only close on a real final whistle)', async () => {
    mockFetchUnfinishedPast.mockResolvedValue([
      { espnEventId: '401883162', homeTeam: 'Castellón', awayTeam: 'Ceuta' },
    ])
    vi.mocked(fetchEspnMatchResult).mockResolvedValue({
      state: 'in', homeTeam: 'Castellón', awayTeam: 'Ceuta', homeScore: 0, awayScore: 0,
    })

    await GET(new Request('http://localhost/api/cron/matches'))

    expect(mockMarkMatchFinished).not.toHaveBeenCalled()
  })

  it('skips a pending match ESPN has no data for, without throwing', async () => {
    mockFetchUnfinishedPast.mockResolvedValue([
      { espnEventId: 'unknown-id', homeTeam: 'Ceuta', awayTeam: 'Rival' },
    ])
    vi.mocked(fetchEspnMatchResult).mockResolvedValue(null)

    const res = await GET(new Request('http://localhost/api/cron/matches'))
    expect(res.status).toBe(200)
    expect(mockMarkMatchFinished).not.toHaveBeenCalled()
  })

  it('prefers the DB-derived form over the club site scrape once results are closed via ESPN', async () => {
    mockFetchUnfinishedPast.mockResolvedValue([])
    mockFetchRecentForm.mockResolvedValue(['L', 'L', 'D', 'W', 'D'])
    vi.mocked(scrapeRecentForm).mockResolvedValue(['W', 'W', 'W'])

    await GET(new Request('http://localhost/api/cron/matches'))

    expect(setConfig).toHaveBeenCalledWith('ceuta_form', 'L,L,D,W,D')
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
