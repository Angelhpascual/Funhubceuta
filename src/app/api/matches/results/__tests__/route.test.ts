import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetchRecentForm = vi.hoisted(() => vi.fn())

vi.mock('@/infrastructure/supabase/MatchesSupabaseRepository', () => {
  function MatchesSupabaseRepository(this: { fetchRecentForm: typeof mockFetchRecentForm }) {
    this.fetchRecentForm = mockFetchRecentForm
  }
  return { MatchesSupabaseRepository }
})
vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({
  getConfig: vi.fn(),
}))

import { getConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { GET } from '../route'

beforeEach(() => vi.resetAllMocks())

describe('GET /api/matches/results', () => {
  it('returns form from repo when available', async () => {
    mockFetchRecentForm.mockResolvedValue(['W', 'D', 'L'])
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.form).toEqual(['W', 'D', 'L'])
    expect(getConfig).not.toHaveBeenCalled()
  })

  it('falls back to app_config when repo returns empty', async () => {
    mockFetchRecentForm.mockResolvedValue([])
    vi.mocked(getConfig).mockResolvedValue('W,W,D')
    const res = await GET()
    const body = await res.json()
    expect(body.form).toEqual(['W', 'W', 'D'])
  })

  it('returns empty form when repo empty and config null', async () => {
    mockFetchRecentForm.mockResolvedValue([])
    vi.mocked(getConfig).mockResolvedValue(null)
    const res = await GET()
    const body = await res.json()
    expect(body.form).toEqual([])
  })

  it('returns 500 on error', async () => {
    mockFetchRecentForm.mockRejectedValue(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
