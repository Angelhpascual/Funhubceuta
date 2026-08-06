import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}))
vi.mock('@/infrastructure/supabase/adminClient', () => ({
  supabaseAdmin: { from: vi.fn() },
}))
vi.mock('@/infrastructure/supabase/PushSubscriptionsRepository', () => ({
  deleteSubscription: vi.fn(),
}))

import webpush from 'web-push'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import { GET } from '../route'

const SUBS = [
  { id: 1, endpoint: 'https://fcm.googleapis.com/sub1', p256dh: 'pk1', auth: 'a1', user_agent: 'Chrome/130', created_at: '2026-01-01T00:00:00Z' },
  { id: 2, endpoint: 'https://web.push.apple.com/sub2', p256dh: 'pk2', auth: 'a2', user_agent: 'Safari/17', created_at: '2026-01-02T00:00:00Z' },
]

function makeReq(secret?: string) {
  const url = `http://localhost/api/push/test${secret ? `?secret=${secret}` : ''}`
  return new Request(url)
}

function mockSubs(subs: typeof SUBS | null) {
  vi.mocked(supabaseAdmin.from).mockReturnValue({
    select: vi.fn().mockResolvedValue({ data: subs }),
  } as never)
}

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
  process.env.VAPID_PUBLIC_KEY = 'vpub'
  process.env.VAPID_PRIVATE_KEY = 'vpriv'
  vi.mocked(webpush.sendNotification).mockResolvedValue({ statusCode: 201 } as never)
})

describe('GET /api/push/test', () => {
  it('returns 401 without secret', async () => {
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong secret', async () => {
    const res = await GET(makeReq('wrong'))
    expect(res.status).toBe(401)
  })

  it('returns empty results when no subscriptions', async () => {
    mockSubs([])
    const res = await GET(makeReq('test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.results).toEqual([])
    expect(body.message).toMatch(/No subscriptions/)
  })

  it('sends to all subscriptions and returns results', async () => {
    mockSubs(SUBS)
    const res = await GET(makeReq('test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.total).toBe(2)
    expect(body.sent).toBe(2)
    expect(body.failed).toBe(0)
    expect(webpush.sendNotification).toHaveBeenCalledTimes(2)
  })

  it('detects browser from endpoint URL', async () => {
    mockSubs(SUBS)
    const res = await GET(makeReq('test-secret'))
    const body = await res.json()
    expect(body.results[0].browser).toBe('Chrome/FCM')
    expect(body.results[1].browser).toBe('Safari/APNs')
  })

  it('marks failed sends and counts them', async () => {
    mockSubs([SUBS[0]])
    vi.mocked(webpush.sendNotification).mockRejectedValue({ statusCode: 500, body: 'Server error' })
    const res = await GET(makeReq('test-secret'))
    const body = await res.json()
    expect(body.sent).toBe(0)
    expect(body.failed).toBe(1)
    expect(body.results[0].status).toBe('error')
  })

  it('auto-removes subscription on 410 and flags as removed', async () => {
    mockSubs([SUBS[0]])
    vi.mocked(webpush.sendNotification).mockRejectedValue({ statusCode: 410 })
    const res = await GET(makeReq('test-secret'))
    const body = await res.json()
    expect(deleteSubscription).toHaveBeenCalledWith(SUBS[0].endpoint)
    expect(body.results[0].removed).toBe(true)
  })

  it('auto-removes subscription on 404', async () => {
    mockSubs([SUBS[0]])
    vi.mocked(webpush.sendNotification).mockRejectedValue({ statusCode: 404 })
    await GET(makeReq('test-secret'))
    expect(deleteSubscription).toHaveBeenCalledWith(SUBS[0].endpoint)
  })

  it('does not remove subscription on other errors', async () => {
    mockSubs([SUBS[0]])
    vi.mocked(webpush.sendNotification).mockRejectedValue({ statusCode: 500 })
    await GET(makeReq('test-secret'))
    expect(deleteSubscription).not.toHaveBeenCalled()
  })

  it('truncates endpoint in results for privacy', async () => {
    mockSubs([SUBS[0]])
    const res = await GET(makeReq('test-secret'))
    const body = await res.json()
    expect(body.results[0].endpoint).toMatch(/\.\.\.$/)
    expect(body.results[0].endpoint.length).toBeLessThanOrEqual(63)
  })
})
