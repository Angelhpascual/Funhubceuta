import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/supabase/adminClient', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { GET, DELETE } from '../route'

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

describe('GET /api/admin/news', () => {
  it('returns 401 without valid session', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns news items excluding discarded', async () => {
    const items = [{ id: '1', title: 'Test', source: 'faro', published_at: null, image_url: null, url: null, published: false, notify_queued: true }]
    const limitMock = vi.fn().mockResolvedValue({ data: items, error: null })
    const eqMock = vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: limitMock }) })
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqMock }),
    } as never)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items).toHaveLength(1)
    expect(eqMock).toHaveBeenCalledWith('discarded', false)
  })

  it('returns 500 on DB error', async () => {
    const limitMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const eqMock = vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: limitMock }) })
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqMock }),
    } as never)
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

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

  it('returns 500 if supabase update fails', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: { message: 'DB error' } })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ update: () => ({ eq: eqMock }) } as never)
    const req = makeRequest({ id: 'abc-123' })
    const res = await DELETE(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('DB error')
  })

  it('returns ok:true on successful soft-delete', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ update: () => ({ eq: eqMock }) } as never)
    const req = makeRequest({ id: 'abc-123' })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('soft-deletes with discarded=true and correct id', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ update: updateMock } as never)
    const req = makeRequest({ id: 'my-news-id' })
    await DELETE(req)
    expect(updateMock).toHaveBeenCalledWith({ published: false, notify_queued: false, discarded: true })
    expect(eqMock).toHaveBeenCalledWith('id', 'my-news-id')
  })
})
