import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/PushSubscriptionsRepository', () => ({
  upsertSubscription: vi.fn(),
  deleteSubscription: vi.fn(),
}))

import { upsertSubscription, deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import { POST, DELETE } from '../route'

beforeEach(() => vi.resetAllMocks())

function makeReq(method: string, body: unknown) {
  return new Request('http://localhost/api/push/subscribe', {
    method,
    headers: { 'Content-Type': 'application/json', 'user-agent': 'TestBrowser' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/push/subscribe', () => {
  it('returns 400 when endpoint is missing', async () => {
    const res = await POST(makeReq('POST', { keys: { p256dh: 'x', auth: 'y' } }))
    expect(res.status).toBe(400)
    expect(upsertSubscription).not.toHaveBeenCalled()
  })

  it('returns 400 when keys are incomplete', async () => {
    const res = await POST(makeReq('POST', { endpoint: 'https://fcm.example.com/token', keys: { p256dh: 'x' } }))
    expect(res.status).toBe(400)
  })

  it('upserts subscription and returns ok', async () => {
    vi.mocked(upsertSubscription).mockResolvedValue(undefined)
    const res = await POST(makeReq('POST', {
      endpoint: 'https://fcm.example.com/token',
      keys: { p256dh: 'p256key', auth: 'authkey' },
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(upsertSubscription).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: 'https://fcm.example.com/token',
      p256dh: 'p256key',
      auth: 'authkey',
    }))
  })

  it('returns 500 when upsert throws', async () => {
    vi.mocked(upsertSubscription).mockRejectedValue(new Error('DB error'))
    const res = await POST(makeReq('POST', {
      endpoint: 'https://fcm.example.com/token',
      keys: { p256dh: 'p', auth: 'a' },
    }))
    expect(res.status).toBe(500)
  })
})

describe('DELETE /api/push/subscribe', () => {
  it('deletes subscription and returns ok', async () => {
    vi.mocked(deleteSubscription).mockResolvedValue(undefined)
    const res = await DELETE(makeReq('DELETE', { endpoint: 'https://fcm.example.com/token' }))
    expect(res.status).toBe(200)
    expect(deleteSubscription).toHaveBeenCalledWith('https://fcm.example.com/token')
  })
})
