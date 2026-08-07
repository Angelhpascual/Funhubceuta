import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUpdateMatchSchedule = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('@/infrastructure/supabase/MatchesSupabaseRepository', () => {
  function MatchesSupabaseRepository(this: { updateMatchSchedule: typeof mockUpdateMatchSchedule }) {
    this.updateMatchSchedule = mockUpdateMatchSchedule
  }
  return { MatchesSupabaseRepository }
})
vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { PATCH } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  mockUpdateMatchSchedule.mockResolvedValue(undefined)
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
})

function makeReq(body: unknown) {
  return new Request('http://localhost/api/admin/matches', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/admin/matches', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await PATCH(makeReq({ id: '1', date: '2026-09-01' }) as never)
    expect(res.status).toBe(401)
  })

  it('returns 400 when id missing', async () => {
    const res = await PATCH(makeReq({ date: '2026-09-01' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when date missing', async () => {
    const res = await PATCH(makeReq({ id: '1' }) as never)
    expect(res.status).toBe(400)
  })

  it('updates match schedule and returns ok', async () => {
    const res = await PATCH(makeReq({ id: 'match-1', date: '2026-09-15', time: '20:00' }) as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(mockUpdateMatchSchedule).toHaveBeenCalledWith('match-1', '2026-09-15', '20:00', expect.any(String))
  })

  it('returns 500 on error', async () => {
    mockUpdateMatchSchedule.mockRejectedValue(new Error('DB error'))
    const res = await PATCH(makeReq({ id: '1', date: '2026-09-15' }) as never)
    expect(res.status).toBe(500)
  })
})
