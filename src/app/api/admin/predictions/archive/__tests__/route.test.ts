import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/adminClient', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { POST } from '../route'

beforeEach(() => { vi.resetAllMocks() })

function makeReq(body: unknown) {
  return new Request('http://localhost/api/admin/predictions/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/predictions/archive', () => {
  it('returns 400 when sessionId missing', async () => {
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it('archives session (sets status to archived)', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ update } as never)

    const res = await POST(makeReq({ sessionId: 's1' }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(update).toHaveBeenCalledWith({ status: 'archived' })
    expect(eq).toHaveBeenCalledWith('id', 's1')
  })

  it('returns 500 on DB error', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'fail' } })
    const update = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ update } as never)

    const res = await POST(makeReq({ sessionId: 's1' }))
    expect(res.status).toBe(500)
  })
})
