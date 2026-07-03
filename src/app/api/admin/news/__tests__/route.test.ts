import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/supabase/adminClient', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { DELETE } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
})

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/admin/news', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('DELETE /api/admin/news', () => {
  it('returns 401 if session is missing or invalid', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const req = makeRequest({ id: 'abc' })
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
