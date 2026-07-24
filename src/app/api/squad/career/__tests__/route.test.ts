import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/scrapers/espnCareerScraper', () => ({
  fetchEspnRoster: vi.fn(),
  scrapeCareerHistory: vi.fn(),
}))
vi.mock('@/infrastructure/supabase/SquadSupabaseRepository', () => ({
  fetchSquadNames: vi.fn(),
  updateCareerHistory: vi.fn(),
}))
vi.mock('@/lib/constants', () => ({ CURRENT_SEASON: '2025-2026' }))

import { fetchEspnRoster, scrapeCareerHistory } from '@/infrastructure/scrapers/espnCareerScraper'
import { fetchSquadNames, updateCareerHistory } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { POST } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
})

function makeRequest(headers?: Record<string, string>) {
  return new Request('http://localhost/api/squad/career', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: '{}',
  })
}

describe('POST /api/squad/career', () => {
  it('returns 401 in production without secret', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
    vi.unstubAllEnvs()
  })

  it('processes players and returns results', async () => {
    vi.mocked(fetchEspnRoster).mockResolvedValue([{ espnId: '123', name: 'Jugador' }])
    vi.mocked(fetchSquadNames).mockResolvedValue([{ id: 'uuid-1', name: 'Jugador' }])
    vi.mocked(scrapeCareerHistory).mockResolvedValue([{ seasons: '2024-25', club: 'Ceuta', logo: null }])
    vi.mocked(updateCareerHistory).mockResolvedValue(undefined)

    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.processed).toBeGreaterThan(0)
    expect(updateCareerHistory).toHaveBeenCalledWith('uuid-1', expect.any(Array), '123')
  })

  it('handles players with no squad match gracefully', async () => {
    vi.mocked(fetchEspnRoster).mockResolvedValue([{ espnId: '999', name: 'Desconocido' }])
    vi.mocked(fetchSquadNames).mockResolvedValue([])
    vi.mocked(scrapeCareerHistory).mockResolvedValue([])

    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.results[0].clubs).toBe(0)
    expect(updateCareerHistory).not.toHaveBeenCalled()
  })

  it('records errors per player without crashing', async () => {
    vi.mocked(fetchEspnRoster).mockResolvedValue([{ espnId: '123', name: 'Jugador' }])
    vi.mocked(fetchSquadNames).mockResolvedValue([{ id: 'uuid-1', name: 'Jugador' }])
    vi.mocked(scrapeCareerHistory).mockRejectedValue(new Error('ESPN timeout'))

    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.results[0].error).toContain('ESPN timeout')
  })
})
