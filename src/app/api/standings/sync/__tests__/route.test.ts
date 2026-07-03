import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/constants', () => ({
  ESPN_STANDINGS: 'https://espn.com/standings',
  CURRENT_SEASON: '2025-2026',
}))
vi.mock('@/infrastructure/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
    })),
  },
}))
vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({ setConfig: vi.fn() }))

const mockUpsertEntries = vi.fn()
const mockUpsertTeams = vi.fn()

vi.mock('@/infrastructure/supabase/StandingsSupabaseRepository', () => ({
  StandingsSupabaseRepository: class {
    upsertEntries = mockUpsertEntries
  },
}))
vi.mock('@/infrastructure/supabase/TeamsSupabaseRepository', () => ({
  TeamsSupabaseRepository: class {
    upsertTeams = mockUpsertTeams
  },
}))

import { setConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { GET, POST } from '../route'

const espnEntry = {
  team: { displayName: 'AD Ceuta', logos: [{ href: 'https://espn.com/logo.png' }] },
  stats: [
    { name: 'gamesPlayed', value: 30 },
    { name: 'wins', value: 15 },
    { name: 'ties', value: 8 },
    { name: 'losses', value: 7 },
    { name: 'pointsFor', value: 45 },
    { name: 'pointsAgainst', value: 30 },
    { name: 'pointDifferential', value: 15 },
    { name: 'points', value: 53 },
  ],
}

function mockEspnFetch(ok: boolean, entries = [espnEntry]) {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    ok
      ? new Response(JSON.stringify({ children: [{ standings: { entries } }] }), { status: 200 })
      : new Response('', { status: 503 })
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  mockUpsertEntries.mockResolvedValue(undefined)
  mockUpsertTeams.mockResolvedValue(undefined)
  vi.mocked(setConfig).mockResolvedValue(undefined)
  process.env.TEST_SECRET = 'test-secret'
})

describe('standings/sync GET', () => {
  it('returns 405 in production without secret', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = await GET(new Request('http://localhost/api/standings/sync'))
    expect(res.status).toBe(405)
    vi.unstubAllEnvs()
  })

  it('syncs standings from ESPN', async () => {
    mockEspnFetch(true)
    const res = await GET(new Request('http://localhost/api/standings/sync'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.teams).toBe(1)
    expect(mockUpsertEntries).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ teamName: 'AD Ceuta', points: 53 })])
    )
  })

  it('returns 500 when ESPN responds with error', async () => {
    mockEspnFetch(false)
    const res = await GET(new Request('http://localhost/api/standings/sync'))
    expect(res.status).toBe(500)
  })

  it('returns 500 when ESPN returns empty entries', async () => {
    mockEspnFetch(true, [])
    const res = await GET(new Request('http://localhost/api/standings/sync'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('0 entries')
  })
})

describe('standings/sync POST', () => {
  it('syncs standings and returns ok', async () => {
    mockEspnFetch(true)
    const res = await POST(new Request('http://localhost/api/standings/sync', { method: 'POST' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('returns 500 on ESPN error', async () => {
    mockEspnFetch(false)
    const res = await POST(new Request('http://localhost/api/standings/sync', { method: 'POST' }))
    expect(res.status).toBe(500)
  })
})
