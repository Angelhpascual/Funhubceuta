import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({
  getConfig: vi.fn(),
}))

import { getConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { GET } from '../leaders/route'

beforeEach(() => { vi.resetAllMocks() })

describe('GET /api/stats/leaders', () => {
  it('returns leaders when config value exists', async () => {
    const leaders = { goals: { label: 'Goles', leaders: [] } }
    vi.mocked(getConfig).mockResolvedValue(JSON.stringify(leaders))

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.leaders).toEqual(leaders)
  })

  it('returns leaders: null when config is empty', async () => {
    vi.mocked(getConfig).mockResolvedValue(null)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.leaders).toBeNull()
  })

  it('sets Cache-Control header', async () => {
    vi.mocked(getConfig).mockResolvedValue(null)
    const res = await GET()
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=3600')
  })

  it('returns 500 when getConfig throws', async () => {
    vi.mocked(getConfig).mockRejectedValue(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
