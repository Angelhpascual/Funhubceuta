import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}))
vi.mock('@/infrastructure/supabase/PushSubscriptionsRepository', () => ({
  getAllSubscriptions: vi.fn(),
  deleteSubscription: vi.fn(),
}))
vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/app/api/cron/live/messages', () => ({
  MSG: {
    kickoff: vi.fn(),
    goalCeuta: vi.fn(),
    goalRival: vi.fn(),
    redCeuta: vi.fn(),
    redRival: vi.fn(),
    winCeuta: vi.fn(),
    lossCeuta: vi.fn(),
    drawCeuta: vi.fn(),
  },
}))

import webpush from 'web-push'
import { getAllSubscriptions, deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { MSG } from '@/app/api/cron/live/messages'
import { POST } from '../route'

const SUB = { endpoint: 'https://fcm.example/sub1', p256dh: 'pk', auth: 'auth' }

function makeReq(body: unknown) {
  return new Request('http://localhost/api/admin/live-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  process.env.VAPID_PUBLIC_KEY = 'vpub'
  process.env.VAPID_PRIVATE_KEY = 'vpriv'
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
  vi.mocked(webpush.sendNotification).mockResolvedValue({} as never)
  vi.mocked(MSG.kickoff).mockReturnValue({ title: 'Kickoff', body: 'Started' })
  vi.mocked(MSG.goalCeuta).mockReturnValue({ title: 'Goal!', body: 'Score' })
  vi.mocked(MSG.goalRival).mockReturnValue({ title: 'Rival', body: 'Score' })
  vi.mocked(MSG.redCeuta).mockReturnValue({ title: 'Red', body: 'Card' })
  vi.mocked(MSG.redRival).mockReturnValue({ title: 'Red', body: 'Card' })
  vi.mocked(MSG.winCeuta).mockReturnValue({ title: 'Win!', body: 'Victory' })
  vi.mocked(MSG.lossCeuta).mockReturnValue({ title: 'Loss', body: 'Defeat' })
  vi.mocked(MSG.drawCeuta).mockReturnValue({ title: 'Draw', body: 'Draw' })
  delete process.env.VERCEL_ENV
})

describe('POST /api/admin/live-push', () => {
  it('returns 401 without admin auth', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await POST(makeReq({ event: 'kickoff' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 in production', async () => {
    process.env.VERCEL_ENV = 'production'
    vi.mocked(getAllSubscriptions).mockResolvedValue([SUB])
    const res = await POST(makeReq({ event: 'kickoff' }))
    expect(res.status).toBe(403)
  })

  it('returns 400 for unknown event', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([SUB])
    const res = await POST(makeReq({ event: 'unknown' }))
    expect(res.status).toBe(400)
  })

  it('returns warn when no admin subscribers', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([])
    const res = await POST(makeReq({ event: 'kickoff' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sent).toBe(0)
    expect(body.warn).toBeDefined()
  })

  it('sends push for kickoff', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([SUB])
    const res = await POST(makeReq({ event: 'kickoff', rival: 'Madrid' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sent).toBe(1)
    expect(body.event).toBe('kickoff')
    expect(webpush.sendNotification).toHaveBeenCalledOnce()
  })

  it('sends all event types without error', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([SUB])
    const events = ['kickoff', 'goal_ceuta', 'goal_rival', 'red_ceuta', 'red_rival', 'win', 'loss', 'draw'] as const
    for (const event of events) {
      vi.mocked(webpush.sendNotification).mockResolvedValue({} as never)
      const res = await POST(makeReq({ event }))
      expect(res.status).toBe(200)
    }
  })

  it('deletes stale subscription on 410', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([SUB])
    vi.mocked(webpush.sendNotification).mockRejectedValue(Object.assign(new Error('Gone'), { statusCode: 410 }))
    const res = await POST(makeReq({ event: 'win' }))
    expect(res.status).toBe(200)
    expect(deleteSubscription).toHaveBeenCalledWith(SUB.endpoint)
  })
})
