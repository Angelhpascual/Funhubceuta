import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/PlayerStatsRepository', () => ({
  fetchLeadersBySeason: vi.fn(),
}))
vi.mock('@/lib/constants', () => ({ CURRENT_SEASON: '2025-2026' }))

import { fetchLeadersBySeason } from '@/infrastructure/supabase/PlayerStatsRepository'
import { GET } from '../player-leaders/route'

beforeEach(() => { vi.resetAllMocks() })

describe('GET /api/stats/player-leaders', () => {
  it('returns leaders data', async () => {
    const leaders = { goals: { label: 'Goles', icon: '⚽', leaders: [{ name: 'Jugador', value: 5, photo: '' }] } }
    vi.mocked(fetchLeadersBySeason).mockResolvedValue(leaders)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.leaders).toEqual(leaders)
  })

  it('returns leaders: null when no stats', async () => {
    vi.mocked(fetchLeadersBySeason).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.leaders).toBeNull()
  })

  it('calls fetchLeadersBySeason with CURRENT_SEASON', async () => {
    vi.mocked(fetchLeadersBySeason).mockResolvedValue(null)
    await GET()
    expect(fetchLeadersBySeason).toHaveBeenCalledWith('2025-2026')
  })

  it('sets Cache-Control header', async () => {
    vi.mocked(fetchLeadersBySeason).mockResolvedValue(null)
    const res = await GET()
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=3600')
  })

  it('returns 500 when repo throws', async () => {
    vi.mocked(fetchLeadersBySeason).mockRejectedValue(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
