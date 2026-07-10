import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/domain/standings/StandingsService', () => {
  const getStandings = vi.fn()
  return {
    StandingsService: class {
      getStandings = getStandings
      static __getStandings = getStandings
    },
  }
})
vi.mock('@/infrastructure/supabase/StandingsSupabaseRepository', () => ({
  StandingsSupabaseRepository: class {},
}))
vi.mock('@/lib/constants', () => ({ CURRENT_SEASON: '2025-2026', STANDINGS_CURRENT_SEASON: '2025-2026' }))

import { StandingsService } from '@/domain/standings/StandingsService'
import { GET } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetStandings: ReturnType<typeof vi.fn> = (StandingsService as any).__getStandings

beforeEach(() => { mockGetStandings.mockReset() })

function makeRequest(params = '') {
  return new Request(`http://localhost/api/standings${params}`)
}

describe('GET /api/standings', () => {
  it('returns standings data', async () => {
    const standings = { groups: [{ name: 'Grupo 1', teams: [] }] }
    mockGetStandings.mockResolvedValue(standings)
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.groups).toHaveLength(1)
  })

  it('returns 404 when no standings found', async () => {
    mockGetStandings.mockResolvedValue(null)
    const res = await GET(makeRequest())
    expect(res.status).toBe(404)
  })

  it('uses season from query param', async () => {
    mockGetStandings.mockResolvedValue({ groups: [] })
    await GET(makeRequest('?season=2024-2025'))
    expect(mockGetStandings).toHaveBeenCalledWith('2024-2025')
  })

  it('uses CURRENT_SEASON when no param', async () => {
    mockGetStandings.mockResolvedValue({ groups: [] })
    await GET(makeRequest())
    expect(mockGetStandings).toHaveBeenCalledWith('2025-2026')
  })

  it('sets Cache-Control header', async () => {
    mockGetStandings.mockResolvedValue({ groups: [] })
    const res = await GET(makeRequest())
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=600')
  })

  it('returns 500 on error', async () => {
    mockGetStandings.mockRejectedValue(new Error('DB error'))
    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
  })
})
