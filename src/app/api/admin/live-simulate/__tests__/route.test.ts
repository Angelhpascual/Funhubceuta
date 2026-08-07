import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}))
vi.mock('@/infrastructure/supabase/PushSubscriptionsRepository', () => ({
  getAllSubscriptions: vi.fn(),
  deleteSubscription: vi.fn(),
}))
vi.mock('@/app/api/cron/live/messages', () => ({
  MSG: {
    kickoff: vi.fn().mockReturnValue({ title: 'Kickoff', body: 'Match started' }),
    goalCeuta: vi.fn().mockReturnValue({ title: 'Goal!', body: 'Ceuta scores' }),
    goalRival: vi.fn().mockReturnValue({ title: 'Rival goal', body: 'Rival scores' }),
    redCeuta: vi.fn().mockReturnValue({ title: 'Red card', body: 'Ceuta red' }),
    redRival: vi.fn().mockReturnValue({ title: 'Red card', body: 'Rival red' }),
    winCeuta: vi.fn().mockReturnValue({ title: 'Win!', body: 'Victory' }),
    lossCeuta: vi.fn().mockReturnValue({ title: 'Loss', body: 'Defeat' }),
    drawCeuta: vi.fn().mockReturnValue({ title: 'Draw', body: 'Draw' }),
  },
}))

import webpush from 'web-push'
import { getAllSubscriptions, deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import { MSG } from '@/app/api/cron/live/messages'
import { POST } from '../route'

const SUB = { endpoint: 'https://fcm.example/sub1', p256dh: 'pk', auth: 'auth' }

function makeReq(body: unknown, secret = 'test-secret') {
  return new Request(`http://localhost/api/admin/live-simulate?secret=${secret}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
  process.env.VAPID_PUBLIC_KEY = 'vpub'
  process.env.VAPID_PRIVATE_KEY = 'vpriv'
  vi.mocked(webpush.sendNotification).mockResolvedValue({} as never)
  vi.mocked(MSG.kickoff).mockReturnValue({ title: 'Kickoff', body: 'Match started' })
  vi.mocked(MSG.goalCeuta).mockReturnValue({ title: 'Goal!', body: 'Ceuta scores' })
  vi.mocked(MSG.goalRival).mockReturnValue({ title: 'Rival goal', body: 'Rival scores' })
  vi.mocked(MSG.redCeuta).mockReturnValue({ title: 'Red card', body: 'Ceuta red' })
  vi.mocked(MSG.redRival).mockReturnValue({ title: 'Red card', body: 'Rival red' })
  vi.mocked(MSG.winCeuta).mockReturnValue({ title: 'Win!', body: 'Victory' })
  vi.mocked(MSG.lossCeuta).mockReturnValue({ title: 'Loss', body: 'Defeat' })
  vi.mocked(MSG.drawCeuta).mockReturnValue({ title: 'Draw', body: 'Draw' })
})

describe('POST /api/admin/live-simulate', () => {
  it('returns 401 with wrong secret', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([SUB])
    const res = await POST(makeReq({ event: 'kickoff' }, 'wrong'))
    expect(res.status).toBe(401)
  })

  it('returns warn when no admin subscribers', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([])
    const res = await POST(makeReq({ event: 'kickoff' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sent).toBe(0)
    expect(body.warn).toMatch(/No admin subscribers/)
  })

  it('returns 400 for unknown event', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([SUB])
    const res = await POST(makeReq({ event: 'unknown' }))
    expect(res.status).toBe(400)
  })

  it('sends push for kickoff event', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([SUB])
    const res = await POST(makeReq({ event: 'kickoff', rival: 'Madrid' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sent).toBe(1)
    expect(body.event).toBe('kickoff')
    expect(webpush.sendNotification).toHaveBeenCalledOnce()
  })

  it('sends push for goal_ceuta event', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([SUB])
    const res = await POST(makeReq({ event: 'goal_ceuta', scorer: 'Zalazar', score: '1-0', minute: "23'" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sent).toBe(1)
  })

  it('deletes subscription on 410 error', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([SUB])
    const err = Object.assign(new Error('Gone'), { statusCode: 410 })
    vi.mocked(webpush.sendNotification).mockRejectedValue(err)
    const res = await POST(makeReq({ event: 'win', score: '2-1' }))
    expect(res.status).toBe(200)
    expect(deleteSubscription).toHaveBeenCalledWith(SUB.endpoint)
  })

  it('sends to multiple subscribers', async () => {
    const SUB2 = { endpoint: 'https://fcm.example/sub2', p256dh: 'pk2', auth: 'auth2' }
    vi.mocked(getAllSubscriptions).mockResolvedValue([SUB, SUB2])
    const res = await POST(makeReq({ event: 'draw', score: '1-1' }))
    const body = await res.json()
    expect(body.sent).toBe(2)
  })
})
