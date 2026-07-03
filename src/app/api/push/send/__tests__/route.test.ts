import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/PushSubscriptionsRepository', () => ({
  getAllSubscriptions: vi.fn(),
  deleteSubscription: vi.fn(),
}))
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}))

import { getAllSubscriptions, deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import webpush from 'web-push'
import { POST } from '../route'

beforeEach(() => { vi.resetAllMocks() })

const sub = { endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1' }
const payload = { title: 'Gol!', body: 'Ceuta marca' }

function makeRequest() {
  return new Request('http://localhost/api/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

describe('POST /api/push/send', () => {
  it('returns sent:0 when no subscriptions', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([])
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sent).toBe(0)
    expect(webpush.sendNotification).not.toHaveBeenCalled()
  })

  it('sends notifications to all subscriptions', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([sub])
    vi.mocked(webpush.sendNotification).mockResolvedValue({ statusCode: 201 } as never)
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sent).toBe(1)
    expect(body.total).toBe(1)
  })

  it('deletes stale subscription on 410 error', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([sub])
    vi.mocked(webpush.sendNotification).mockRejectedValue(Object.assign(new Error('Gone'), { statusCode: 410 }))
    vi.mocked(deleteSubscription).mockResolvedValue(undefined)
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sent).toBe(0)
    expect(deleteSubscription).toHaveBeenCalledWith(sub.endpoint)
  })

  it('counts partial success correctly', async () => {
    const sub2 = { endpoint: 'https://push.example.com/2', p256dh: 'key2', auth: 'auth2' }
    vi.mocked(getAllSubscriptions).mockResolvedValue([sub, sub2])
    vi.mocked(webpush.sendNotification)
      .mockResolvedValueOnce({ statusCode: 201 } as never)
      .mockRejectedValueOnce(new Error('Network error'))
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sent).toBe(1)
    expect(body.total).toBe(2)
  })
})
