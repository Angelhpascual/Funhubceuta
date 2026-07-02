import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

// Mock adminClient
vi.mock('@/infrastructure/supabase/adminClient', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { DELETE } from '../route'

const ADMIN_SECRET = 'test-secret'

beforeEach(() => {
  vi.resetAllMocks()
  process.env.ADMIN_SECRET = ADMIN_SECRET
})

function makeRequest(body: unknown, token?: string) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === 'admin_token' ? { value: token ?? ADMIN_SECRET } : undefined),
  } as never)
  return new Request('http://localhost/api/admin/news', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('DELETE /api/admin/news', () => {
  it('returns 401 if token is missing', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => undefined,
    } as never)
    const req = new Request('http://localhost/api/admin/news', {
      method: 'DELETE',
      body: JSON.stringify({ id: 'abc' }),
    })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 if token is wrong', async () => {
    const req = makeRequest({ id: 'abc' }, 'wrong-token')
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 if id is missing', async () => {
    const req = makeRequest({})
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it('returns 500 if supabase delete fails', async () => {
    const mockDelete = vi.fn().mockResolvedValue({ error: { message: 'DB error' } })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ delete: () => ({ eq: mockDelete }) } as never)
    const req = makeRequest({ id: 'abc-123' })
    const res = await DELETE(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('DB error')
  })

  it('returns ok:true on successful delete', async () => {
    const mockDelete = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ delete: () => ({ eq: mockDelete }) } as never)
    const req = makeRequest({ id: 'abc-123' })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('calls delete with the correct id', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ delete: deleteMock } as never)
    const req = makeRequest({ id: 'my-news-id' })
    await DELETE(req)
    expect(eqMock).toHaveBeenCalledWith('id', 'my-news-id')
  })
})
