import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({
  getConfig: vi.fn(),
}))

import { getConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { GET } from '../route'

beforeEach(() => vi.resetAllMocks())

describe('GET /api/stats/leaders', () => {
  it('returns parsed leaders when config exists', async () => {
    const leaders = [{ name: 'Player A', goals: 5 }]
    vi.mocked(getConfig).mockResolvedValue(JSON.stringify(leaders))
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.leaders).toEqual(leaders)
  })

  it('returns leaders: null when no config', async () => {
    vi.mocked(getConfig).mockResolvedValue(null)
    const res = await GET()
    const body = await res.json()
    expect(body.leaders).toBeNull()
  })

  it('returns 500 on error', async () => {
    vi.mocked(getConfig).mockRejectedValue(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
