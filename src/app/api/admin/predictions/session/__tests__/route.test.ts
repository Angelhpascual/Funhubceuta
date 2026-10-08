import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/supabase/PredictionRepository', () => ({
  createPredictionSession: vi.fn(),
  openPredictionSession: vi.fn(),
}))
vi.mock('@/infrastructure/supabase/adminClient', () => ({ supabaseAdmin: { from: vi.fn() } }))
vi.mock('@/infrastructure/push/sendPush', () => ({ sendPush: vi.fn().mockResolvedValue({ sent: 0, total: 0 }) }))
vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { createPredictionSession, openPredictionSession } from '@/infrastructure/supabase/PredictionRepository'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { sendPush } from '@/infrastructure/push/sendPush'
import { logCron } from '@/infrastructure/supabase/logCron'
import { POST, PUT } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
  vi.mocked(sendPush).mockResolvedValue({ sent: 0, total: 0 })
})

function makeReq(method: string, body: unknown) {
  return new Request('http://localhost/api/admin/predictions/session', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/predictions/session', () => {
  it('returns 400 when matchLabel missing', async () => {
    const res = await POST(makeReq('POST', { jornada: 'J20' }))
    expect(res.status).toBe(400)
  })

  it('creates session and returns it', async () => {
    const session = { id: 's1', match_label: 'Ceuta vs Betis', status: 'pending' }
    vi.mocked(createPredictionSession).mockResolvedValue({ data: session, error: null } as never)

    const res = await POST(makeReq('POST', { matchLabel: 'Ceuta vs Betis', jornada: 'J20' }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.session).toEqual(session)
  })

  it('returns 500 on create error', async () => {
    vi.mocked(createPredictionSession).mockResolvedValue({ data: null, error: { message: 'fail' } } as never)
    const res = await POST(makeReq('POST', { matchLabel: 'Ceuta vs X' }))
    expect(res.status).toBe(500)
  })
})

describe('PUT /api/admin/predictions/session', () => {
  it('returns 400 when missing sessionId or action', async () => {
    const res = await PUT(makeReq('PUT', { sessionId: 's1' }))
    expect(res.status).toBe(400)
  })

  it('opens session successfully', async () => {
    vi.mocked(openPredictionSession).mockResolvedValue({ error: null })
    const maybeSingle = vi.fn().mockResolvedValue({ data: { match_label: 'Ceuta vs X', jornada: 'J20' } })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) } as never)

    const res = await PUT(makeReq('PUT', { sessionId: 's1', action: 'open' }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(openPredictionSession).toHaveBeenCalledWith('s1')
  })

  it('surfaces the push delivery result in the response', async () => {
    vi.mocked(openPredictionSession).mockResolvedValue({ error: null })
    const maybeSingle = vi.fn().mockResolvedValue({ data: { match_label: 'Ceuta vs X', jornada: 'J20' } })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) } as never)
    vi.mocked(sendPush).mockResolvedValue({ sent: 4, total: 5 })

    const res = await PUT(makeReq('PUT', { sessionId: 's1', action: 'open' }))
    const body = await res.json()

    expect(body.push).toEqual({ sent: 4, total: 5 })
  })

  it('still reports the session as open when the push notification throws, but logs it now instead of swallowing it silently (regression: this used to be a fire-and-forget .catch(() => {}) with no logging at all)', async () => {
    vi.mocked(openPredictionSession).mockResolvedValue({ error: null })
    const maybeSingle = vi.fn().mockResolvedValue({ data: { match_label: 'Ceuta vs X', jornada: 'J20' } })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) } as never)
    vi.mocked(sendPush).mockRejectedValue(new Error('VAPID misconfigured'))

    const res = await PUT(makeReq('PUT', { sessionId: 's1', action: 'open' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.push).toEqual({ error: 'Error: VAPID misconfigured' })
    expect(logCron).toHaveBeenCalledWith('predictions-session', 'error', 0, expect.objectContaining({ stage: 'sendPush' }))
  })

  it('returns 400 for unknown action', async () => {
    const res = await PUT(makeReq('PUT', { sessionId: 's1', action: 'unknown' }))
    expect(res.status).toBe(400)
  })
})
