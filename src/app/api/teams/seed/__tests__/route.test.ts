import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/client', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '@/infrastructure/supabase/client'
import { POST } from '../route'

function mockSupabaseChain() {
  vi.mocked(supabase.from).mockReturnValue({
    update: vi.fn().mockReturnValue({
      ilike: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  } as never)
}

beforeEach(() => {
  vi.resetAllMocks()
  mockSupabaseChain()
})

describe('POST /api/teams/seed', () => {
  it('returns ok with venue count', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.venues).toBeGreaterThan(0)
  })

  it('calls update for each venue entry', async () => {
    await POST()
    expect(supabase.from).toHaveBeenCalledWith('teams')
  })

  it('returns the correct venue count (25 entries in VENUES map)', async () => {
    const res = await POST()
    const body = await res.json()
    expect(body.venues).toBe(25)
  })
})
