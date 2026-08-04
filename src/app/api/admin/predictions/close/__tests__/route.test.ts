import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/supabase/PredictionRepository', () => ({
  closePredictionSession: vi.fn(),
}))

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { closePredictionSession } from '@/infrastructure/supabase/PredictionRepository'
import { POST } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
})

function makeReq(body: unknown) {
  return new Request('http://localhost/api/admin/predictions/close', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/predictions/close', () => {
  it('returns 400 when missing required fields', async () => {
    const res = await POST(makeReq({ sessionId: 's1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when homeResult missing', async () => {
    const res = await POST(makeReq({ sessionId: 's1', awayResult: 1 }))
    expect(res.status).toBe(400)
  })

  it('closes session with result', async () => {
    vi.mocked(closePredictionSession).mockResolvedValue({ error: null })

    const res = await POST(makeReq({ sessionId: 's1', homeResult: 2, awayResult: 1 }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(closePredictionSession).toHaveBeenCalledWith('s1', 2, 1)
  })

  it('returns 500 on error', async () => {
    vi.mocked(closePredictionSession).mockResolvedValue({ error: { message: 'fail' } } as never)
    const res = await POST(makeReq({ sessionId: 's1', homeResult: 0, awayResult: 0 }))
    expect(res.status).toBe(500)
  })
})
