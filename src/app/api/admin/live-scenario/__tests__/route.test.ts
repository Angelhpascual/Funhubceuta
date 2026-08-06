import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/infrastructure/supabase/adminClient', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))
vi.mock('@/infrastructure/push/sendPush', () => ({
  sendPushDev: vi.fn().mockResolvedValue({ sent: 2, total: 2 }),
}))

import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { sendPushDev } from '@/infrastructure/push/sendPush'
import { GET } from '../route'

function makeReq(params: Record<string, string>) {
  const qs = new URLSearchParams({ secret: 'test-secret', ...params }).toString()
  return new NextRequest(`http://localhost/api/admin/live-scenario?${qs}`)
}

function mockSupabase(prevState: unknown = null) {
  vi.mocked(supabaseAdmin.from).mockImplementation(() => ({
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({}),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: prevState ? { value: JSON.stringify(prevState) } : null,
        }),
      }),
    }),
  } as never))
}

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
  vi.mocked(sendPushDev).mockResolvedValue({ sent: 2, total: 2 })
  mockSupabase()
})

describe('GET /api/admin/live-scenario', () => {
  it('returns 403 with wrong secret', async () => {
    const res = await GET(makeReq({ secret: 'wrong' }) as never)
    expect(res.status).toBe(403)
  })

  it('returns 400 for unknown step', async () => {
    const res = await GET(makeReq({ step: 'nonexistent' }) as never)
    expect(res.status).toBe(400)
  })

  it('resets state successfully', async () => {
    mockSupabase()
    const res = await GET(makeReq({ step: 'reset' }) as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('sends push test notification', async () => {
    const res = await GET(makeReq({ step: 'push' }) as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(sendPushDev).toHaveBeenCalledOnce()
    expect(body.sent).toBe(2)
  })

  it('handles kickoff step and sends push notification', async () => {
    mockSupabase(null)
    const res = await GET(makeReq({ step: 'kickoff' }) as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.step).toBe('kickoff')
    expect(body.state).toBe('in')
    expect(sendPushDev).toHaveBeenCalledOnce()
    expect(body.notifications).toHaveLength(1)
  })

  it('handles goal step and triggers goal notification', async () => {
    mockSupabase({ homeScore: 0, awayScore: 0, state: 'in', events: [] })
    const res = await GET(makeReq({ step: 'goal1' }) as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.score).toBe('0-1')
    expect(body.notifications.some((n: string) => n.includes('goal-ceuta'))).toBe(true)
  })

  it('handles fulltime step and sends end-of-match push', async () => {
    mockSupabase({ homeScore: 1, awayScore: 2, state: 'in', events: [] })
    const res = await GET(makeReq({ step: 'fulltime' }) as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.state).toBe('post')
    expect(body.notifications.some((n: string) => n.includes('fulltime'))).toBe(true)
  })

  it('defaults to kickoff step when no step provided', async () => {
    mockSupabase(null)
    const res = await GET(makeReq({}) as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.step).toBe('kickoff')
  })
})
