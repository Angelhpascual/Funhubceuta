import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/PushSubscriptionsRepository', () => ({
  upsertSubscription: vi.fn(),
  deleteSubscription: vi.fn(),
}))

import { upsertSubscription, deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import { POST, DELETE } from '../subscribe/route'

beforeEach(() => { vi.resetAllMocks() })

function makePost(body: unknown) {
  return new Request('http://localhost/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/push/subscribe', () => {
  it('returns ok:true for valid subscription', async () => {
    vi.mocked(upsertSubscription).mockResolvedValue(undefined)
    const res = await POST(makePost({
      endpoint: 'https://push.example.com/sub1',
      keys: { p256dh: 'abc', auth: 'xyz' },
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('returns 400 when endpoint is missing', async () => {
    const res = await POST(makePost({ keys: { p256dh: 'abc', auth: 'xyz' } }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when keys are missing', async () => {
    const res = await POST(makePost({ endpoint: 'https://push.example.com/sub1' }))
    expect(res.status).toBe(400)
  })

  it('returns 500 when upsert throws', async () => {
    vi.mocked(upsertSubscription).mockRejectedValue(new Error('DB error'))
    const res = await POST(makePost({
      endpoint: 'https://push.example.com/sub1',
      keys: { p256dh: 'abc', auth: 'xyz' },
    }))
    expect(res.status).toBe(500)
  })
})

describe('DELETE /api/push/subscribe', () => {
  it('deletes subscription and returns ok:true', async () => {
    vi.mocked(deleteSubscription).mockResolvedValue(undefined)
    const req = new Request('http://localhost/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: 'https://push.example.com/sub1' }),
    })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
    expect(deleteSubscription).toHaveBeenCalledWith('https://push.example.com/sub1')
  })
})
