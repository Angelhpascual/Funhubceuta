import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/SquadSupabaseRepository', () => ({
  fetchSquadBySeason: vi.fn(),
}))
vi.mock('@/lib/constants', () => ({ CURRENT_SEASON: '2025-2026' }))

import { fetchSquadBySeason } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { GET } from '../route'

beforeEach(() => { vi.resetAllMocks() })

describe('GET /api/squad', () => {
  it('returns grouped squad and total', async () => {
    vi.mocked(fetchSquadBySeason).mockResolvedValue({
      grouped: [{ group: 'Porteros', players: [] }],
      total: 22,
    })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.total).toBe(22)
    expect(body.grouped).toHaveLength(1)
  })

  it('queries with CURRENT_SEASON', async () => {
    vi.mocked(fetchSquadBySeason).mockResolvedValue({ grouped: [], total: 0 })
    await GET()
    expect(fetchSquadBySeason).toHaveBeenCalledWith('2025-2026')
  })

  it('sets Cache-Control header', async () => {
    vi.mocked(fetchSquadBySeason).mockResolvedValue({ grouped: [], total: 0 })
    const res = await GET()
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=3600')
  })

  it('returns 500 when repo throws', async () => {
    vi.mocked(fetchSquadBySeason).mockRejectedValue(new Error('Supabase error'))
    const res = await GET()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Supabase error')
  })
})
