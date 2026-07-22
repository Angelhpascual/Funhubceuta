import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/constants', () => ({
  ESPN_SCOREBOARD: 'https://espn.com/scoreboard',
  ESPN_SUMMARY: 'https://espn.com/summary',
}))
vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({
  getConfig: vi.fn(),
}))
vi.mock('@/infrastructure/supabase/MatchesSupabaseRepository', () => {
  const fetchByEspnId = vi.fn()
  return {
    MatchesSupabaseRepository: class {
      fetchByEspnId = fetchByEspnId
      static __fetchByEspnId = fetchByEspnId
    },
  }
})

import { getConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { GET } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetchByEspnId: ReturnType<typeof vi.fn> = (MatchesSupabaseRepository as any).__fetchByEspnId

function makeScoreboard(state: string, espnId = 'evt1') {
  return {
    events: [{
      id: espnId,
      date: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
      competitions: [{
        status: { type: { state, description: state === 'in' ? 'In Progress' : 'Final' }, displayClock: "45'" },
        competitors: [
          { homeAway: 'home', score: '1', team: { id: '5404', displayName: 'AD Ceuta' } },
          { homeAway: 'away', score: '0', team: { id: '100', displayName: 'Rival FC' } },
        ],
        venue: { fullName: 'Alfonso Murube' },
      }],
    }],
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getConfig).mockResolvedValue(null)
  mockFetchByEspnId.mockResolvedValue(null)
})

describe('GET /api/live (production — no mock)', () => {
  beforeEach(() => { vi.stubEnv('VERCEL_ENV', 'production') })
  afterEach(() => { vi.unstubAllEnvs() })

  it('returns match:null when ESPN scoreboard fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('', { status: 503 }))
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.match).toBeNull()
  })

  it('returns match:null when no Ceuta event found', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ events: [{ id: 'other', competitions: [], date: '' }] }), { status: 200 })
    )
    const res = await GET()
    const body = await res.json()
    expect(body.match).toBeNull()
  })

  it('returns pre-match data when state is pre', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(makeScoreboard('pre')), { status: 200 }))
    )
    const res = await GET()
    const body = await res.json()
    expect(body.match).not.toBeNull()
    expect(body.match.state).toBe('pre')
    expect(body.match.homeTeam).toBe('AD Ceuta')
    expect(body.match.events).toEqual([])
  })

  it('returns live match when state is in and DB confirms kickoff within 4h', async () => {
    const fetchMock = vi.spyOn(global, 'fetch')
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify(makeScoreboard('in')), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ plays: [] }), { status: 200 }))

    // DB says kickoff was 1h ago → valid live window
    mockFetchByEspnId.mockResolvedValue({ date: new Date(Date.now() - 60 * 60 * 1000).toISOString() })

    const res = await GET()
    const body = await res.json()
    expect(body.match.state).toBe('in')
    expect(body.match.clock).toBe("45'")
  })

  it('downgrades in→pre when DB kickoff is outside 4h window', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(makeScoreboard('in')), { status: 200 }))
    )
    // DB says kickoff was 6h ago → stale signal
    mockFetchByEspnId.mockResolvedValue({ date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() })

    const res = await GET()
    const body = await res.json()
    expect(body.match.state).toBe('pre')
    expect(body.match.clock).toBe('')
  })

  it('returns match:null for post match older than 3h', async () => {
    const oldDate = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    const sb = makeScoreboard('post')
    sb.events[0].date = oldDate
    vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(sb), { status: 200 }))
    )
    const res = await GET()
    const body = await res.json()
    expect(body.match).toBeNull()
  })
})

describe('GET /api/live (dev mock)', () => {
  it('returns mocked match when live_match_mock config exists', async () => {
    vi.stubEnv('NODE_ENV', 'test') // non-production
    const mockMatch = { state: 'in', homeTeam: 'Ceuta', awayTeam: 'Rival', homeScore: 2, awayScore: 0 }
    vi.mocked(getConfig).mockResolvedValue(JSON.stringify(mockMatch))

    const res = await GET()
    const body = await res.json()
    expect(body.match.state).toBe('in')
    expect(body.match.homeScore).toBe(2)
    vi.unstubAllEnvs()
  })
})
