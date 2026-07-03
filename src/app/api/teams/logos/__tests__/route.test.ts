import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/constants', () => ({ STANDINGS_CURRENT_SEASON: '2025-2026' }))
vi.mock('@/infrastructure/supabase/client', () => {
  const upsert = vi.fn()
  const from = vi.fn(() => ({ upsert }))
  return { supabase: { from, __from: from, __upsert: upsert } }
})

import { supabase } from '@/infrastructure/supabase/client'
import { GET } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom: ReturnType<typeof vi.fn> = (supabase as any).__from
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpsert: ReturnType<typeof vi.fn> = (supabase as any).__upsert

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
})

describe('GET /api/teams/logos', () => {
  it('returns 401 without secret', async () => {
    const res = await GET(new Request('http://localhost/api/teams/logos'))
    expect(res.status).toBe(401)
  })

  it('upserts all teams and returns total', async () => {
    mockFrom.mockReturnValue({ upsert: mockUpsert })
    mockUpsert.mockResolvedValue({ error: null })
    const res = await GET(new Request('http://localhost/api/teams/logos?secret=test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.total).toBeGreaterThan(0)
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ onConflict: 'name,season' })
    )
  })

  it('returns 500 on upsert error', async () => {
    mockFrom.mockReturnValue({ upsert: mockUpsert })
    mockUpsert.mockResolvedValue({ error: { message: 'DB error' } })
    const res = await GET(new Request('http://localhost/api/teams/logos?secret=test-secret'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.ok).toBe(false)
  })
})
