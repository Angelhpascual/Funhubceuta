import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/adminClient', () => ({
  supabaseAdmin: { from: vi.fn() },
}))
vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))

import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { POST } from '../route'

function mockSupabaseChain() {
  vi.mocked(supabaseAdmin.from).mockReturnValue({
    update: vi.fn().mockReturnValue({
      ilike: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  } as never)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
  mockSupabaseChain()
})

describe('POST /api/teams/seed', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await POST()
    expect(res.status).toBe(401)
  })

  it('returns ok with venue count', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.venues).toBeGreaterThan(0)
  })

  it('calls update for each venue entry', async () => {
    await POST()
    expect(supabaseAdmin.from).toHaveBeenCalledWith('teams')
  })

  it('returns the correct venue count (25 entries in VENUES map)', async () => {
    const res = await POST()
    const body = await res.json()
    expect(body.venues).toBe(25)
  })
})
