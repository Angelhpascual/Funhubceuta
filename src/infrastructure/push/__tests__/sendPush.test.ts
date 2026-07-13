import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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
import { sendPush } from '../sendPush'

beforeEach(() => {
  vi.resetAllMocks()
  process.env.VERCEL_ENV = 'production'
})

afterEach(() => {
  delete process.env.VERCEL_ENV
})

const sub = { endpoint: 'https://push.example.com/1', p256dh: 'k', auth: 'a' }
const payload = { title: 'Test', body: 'Mensaje' }

describe('sendPush', () => {
  it('returns sent:0 when no subscriptions', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([])
    expect(await sendPush(payload)).toEqual({ sent: 0, total: 0 })
    expect(webpush.sendNotification).not.toHaveBeenCalled()
  })

  it('sends to all subscriptions and returns counts', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([sub])
    vi.mocked(webpush.sendNotification).mockResolvedValue({ statusCode: 201 } as never)
    const result = await sendPush(payload)
    expect(result.sent).toBe(1)
    expect(result.total).toBe(1)
  })

  it('deletes subscription on 410 and counts as failed', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([sub])
    vi.mocked(webpush.sendNotification).mockRejectedValue(Object.assign(new Error('Gone'), { statusCode: 410 }))
    vi.mocked(deleteSubscription).mockResolvedValue(undefined)
    const result = await sendPush(payload)
    expect(result.sent).toBe(0)
    expect(deleteSubscription).toHaveBeenCalledWith(sub.endpoint)
  })

  it('counts partial success with multiple subs', async () => {
    const sub2 = { endpoint: 'https://push.example.com/2', p256dh: 'k2', auth: 'a2' }
    vi.mocked(getAllSubscriptions).mockResolvedValue([sub, sub2])
    vi.mocked(webpush.sendNotification)
      .mockResolvedValueOnce({ statusCode: 201 } as never)
      .mockRejectedValueOnce(new Error('network'))
    const result = await sendPush(payload)
    expect(result.sent).toBe(1)
    expect(result.total).toBe(2)
  })
})
