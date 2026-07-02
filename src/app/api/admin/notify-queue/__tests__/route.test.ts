import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({ cookies: vi.fn() }))
vi.mock('@/infrastructure/supabase/adminClient', () => ({
  supabaseAdmin: { from: vi.fn() },
}))
vi.mock('@/infrastructure/push/sendPush', () => ({
  sendPush: vi.fn(),
}))
vi.mock('@/infrastructure/supabase/logCron', () => ({
  logNotification: vi.fn(),
}))

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { sendPush } from '@/infrastructure/push/sendPush'
import { GET, POST } from '../route'

const SECRET = 'test-secret'

beforeEach(() => {
  vi.resetAllMocks()
  process.env.ADMIN_SECRET = SECRET
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === 'admin_token' ? { value: SECRET } : undefined),
  } as never)
})

function mockFrom(select?: unknown, update?: unknown, single?: unknown) {
  vi.mocked(supabaseAdmin.from).mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: select ?? [] }),
        }),
        single: vi.fn().mockResolvedValue({ data: single ?? null }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  } as never)
}

// ── GET ──────────────────────────────────────────────────────────────────────

describe('GET /api/admin/notify-queue', () => {
  it('returns 401 without valid token', async () => {
    vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as never)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns queued articles', async () => {
    const articles = [{ id: '1', title: 'Noticia test', source: 'as', image_url: null, published_at: null, url: 'https://as.com/1' }]
    mockFrom(articles)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items).toHaveLength(1)
    expect(body.items[0].title).toBe('Noticia test')
  })

  it('returns empty array when no queued articles', async () => {
    mockFrom([])
    const res = await GET()
    const body = await res.json()
    expect(body.items).toEqual([])
  })
})

// ── POST ─────────────────────────────────────────────────────────────────────

describe('POST /api/admin/notify-queue', () => {
  it('returns 401 without valid token', async () => {
    vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as never)
    const req = new Request('http://localhost/api/admin/notify-queue', {
      method: 'POST',
      body: JSON.stringify({ id: '1', action: 'discard' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 if id or action missing', async () => {
    const req = new Request('http://localhost/api/admin/notify-queue', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('discard sets notify_queued=false without sending push', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: eqMock }),
    } as never)

    const req = new Request('http://localhost/api/admin/notify-queue', {
      method: 'POST',
      body: JSON.stringify({ id: 'abc', action: 'discard' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(sendPush).not.toHaveBeenCalled()
    expect(eqMock).toHaveBeenCalledWith('id', 'abc')
  })

  it('send calls sendPush and clears notify_queued', async () => {
    const article = { id: 'abc', title: 'Gol del Ceuta', source: 'as', url: 'https://as.com/1' }
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: article }),
        }),
      }),
      update: vi.fn().mockReturnValue({ eq: eqMock }),
    } as never)
    vi.mocked(sendPush).mockResolvedValue({ sent: 3, total: 3 })

    const req = new Request('http://localhost/api/admin/notify-queue', {
      method: 'POST',
      body: JSON.stringify({ id: 'abc', action: 'send' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sent).toBe(3)
    expect(sendPush).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.stringContaining('Gol del Ceuta'),
      url: '/',
    }))
  })

  it('returns 404 if article not found on send', async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    } as never)

    const req = new Request('http://localhost/api/admin/notify-queue', {
      method: 'POST',
      body: JSON.stringify({ id: 'nonexistent', action: 'send' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })
})
