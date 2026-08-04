import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/supabase/MvpRepository', () => ({
  createMvpSession: vi.fn(),
  openMvpSession: vi.fn(),
  closeMvpSession: vi.fn(),
}))
vi.mock('@/infrastructure/supabase/adminClient', () => ({
  supabaseAdmin: { from: vi.fn() },
}))
vi.mock('@/infrastructure/push/sendPush', () => ({ sendPush: vi.fn().mockResolvedValue({ sent: 0, total: 0 }) }))

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { createMvpSession, openMvpSession, closeMvpSession } from '@/infrastructure/supabase/MvpRepository'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { sendPush } from '@/infrastructure/push/sendPush'
import { POST, PATCH, DELETE } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
  vi.mocked(sendPush).mockResolvedValue({ sent: 0, total: 0 })
})

function makeReq(method: string, body: unknown) {
  return new Request('http://localhost/api/admin/mvp/session', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const candidates = [
  { id: 'c1', name: 'Player 1', number: 9, position: 'DEL' },
  { id: 'c2', name: 'Player 2', number: 10, position: 'MED' },
]

describe('POST /api/admin/mvp/session', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await POST(makeReq('POST', { matchLabel: 'X', candidates }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when matchLabel missing', async () => {
    const res = await POST(makeReq('POST', { candidates }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when fewer than 2 candidates', async () => {
    const res = await POST(makeReq('POST', { matchLabel: 'X', candidates: [candidates[0]] }))
    expect(res.status).toBe(400)
  })

  it('creates session and returns it', async () => {
    const session = { id: 's1', match_label: 'Ceuta vs X', status: 'pending' }
    vi.mocked(createMvpSession).mockResolvedValue({ data: session, error: null } as never)

    const res = await POST(makeReq('POST', { matchLabel: 'Ceuta vs X', candidates }))
    expect(res.status).toBe(200)
    expect((await res.json()).session).toEqual(session)
  })
})

describe('PATCH /api/admin/mvp/session', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await PATCH(makeReq('PATCH', { sessionId: 's1', action: 'open' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when missing sessionId or action', async () => {
    const res = await PATCH(makeReq('PATCH', { sessionId: 's1' }))
    expect(res.status).toBe(400)
  })

  it('opens session', async () => {
    vi.mocked(openMvpSession).mockResolvedValue({ error: null })
    const maybeSingle = vi.fn().mockResolvedValue({ data: { match_label: 'Ceuta vs X', jornada: 'J20' } })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) } as never)

    const res = await PATCH(makeReq('PATCH', { sessionId: 's1', action: 'open' }))
    expect(res.status).toBe(200)
    expect(openMvpSession).toHaveBeenCalledWith('s1')
  })

  it('closes session', async () => {
    vi.mocked(closeMvpSession).mockResolvedValue({ error: null })
    const res = await PATCH(makeReq('PATCH', { sessionId: 's1', action: 'close' }))
    expect(res.status).toBe(200)
    expect(closeMvpSession).toHaveBeenCalledWith('s1')
  })

  it('returns 400 for unknown action', async () => {
    const res = await PATCH(makeReq('PATCH', { sessionId: 's1', action: 'unknown' }))
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/admin/mvp/session', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await DELETE(makeReq('DELETE', { sessionId: 's1' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when sessionId missing', async () => {
    const res = await DELETE(makeReq('DELETE', {}))
    expect(res.status).toBe(400)
  })

  it('deletes session', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ delete: vi.fn().mockReturnValue({ eq }) } as never)

    const res = await DELETE(makeReq('DELETE', { sessionId: 's1' }))
    expect(res.status).toBe(200)
    expect(eq).toHaveBeenCalledWith('id', 's1')
  })
})
