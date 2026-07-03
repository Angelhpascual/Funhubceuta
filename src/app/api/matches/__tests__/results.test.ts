import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/MatchesSupabaseRepository', () => {
  const fetchRecentForm = vi.fn()
  return {
    MatchesSupabaseRepository: class {
      fetchRecentForm = fetchRecentForm
      static __fetchRecentForm = fetchRecentForm
    },
  }
})
vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({
  getConfig: vi.fn(),
}))

import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { getConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { GET } from '../results/route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetchRecentForm: ReturnType<typeof vi.fn> = (MatchesSupabaseRepository as any).__fetchRecentForm

beforeEach(() => { mockFetchRecentForm.mockReset(); vi.mocked(getConfig).mockReset() })

describe('GET /api/matches/results', () => {
  it('returns form from DB when matches exist', async () => {
    mockFetchRecentForm.mockResolvedValue(['W', 'D', 'L'])
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.form).toEqual(['W', 'D', 'L'])
    expect(getConfig).not.toHaveBeenCalled()
  })

  it('falls back to app_config when no DB form', async () => {
    mockFetchRecentForm.mockResolvedValue([])
    vi.mocked(getConfig).mockResolvedValue('W,W,D')
    const res = await GET()
    const body = await res.json()
    expect(body.form).toEqual(['W', 'W', 'D'])
  })

  it('returns empty form when both DB and config are empty', async () => {
    mockFetchRecentForm.mockResolvedValue([])
    vi.mocked(getConfig).mockResolvedValue(null)
    const res = await GET()
    const body = await res.json()
    expect(body.form).toEqual([])
  })

  it('sets Cache-Control header on DB form', async () => {
    mockFetchRecentForm.mockResolvedValue(['W'])
    const res = await GET()
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=300')
  })

  it('returns 500 when repo throws', async () => {
    mockFetchRecentForm.mockRejectedValue(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
