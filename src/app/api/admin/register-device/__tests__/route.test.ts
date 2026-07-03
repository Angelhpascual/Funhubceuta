import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/supabase/PushSubscriptionsRepository', () => ({
  markSubscriptionAsAdmin: vi.fn(),
}))

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { markSubscriptionAsAdmin } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import { POST } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
})

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/admin/register-device', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/register-device', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await POST(makeRequest({ endpoint: 'https://push.example.com/1' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when endpoint is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('marks subscription as admin and returns ok:true', async () => {
    vi.mocked(markSubscriptionAsAdmin).mockResolvedValue({ error: null })
    const res = await POST(makeRequest({ endpoint: 'https://push.example.com/1' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(markSubscriptionAsAdmin).toHaveBeenCalledWith('https://push.example.com/1')
  })

  it('returns 500 when repo returns error', async () => {
    vi.mocked(markSubscriptionAsAdmin).mockResolvedValue({ error: 'update failed' })
    const res = await POST(makeRequest({ endpoint: 'https://push.example.com/1' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('update failed')
  })
})
