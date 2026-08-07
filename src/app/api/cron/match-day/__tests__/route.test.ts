import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/constants', () => ({ ESPN_BASE: 'https://espn.com' }))
vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))
vi.mock('@/infrastructure/supabase/PushSubscriptionsRepository', () => ({
  getAllSubscriptions: vi.fn(),
  deleteSubscription: vi.fn(),
}))
vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}))
vi.mock('@upstash/qstash', () => {
  const verify = vi.fn()
  return { Receiver: class { verify = verify; static __verify = verify } }
})

import { logCron } from '@/infrastructure/supabase/logCron'
import { getAllSubscriptions, deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import webpush from 'web-push'
import { Receiver } from '@upstash/qstash'
import { GET, POST } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockVerify: ReturnType<typeof vi.fn> = (Receiver as any).__verify

const sub = { endpoint: 'https://push.example.com/1', p256dh: 'k', auth: 'a' }

function makeScoreboard(state = 'pre') {
  return {
    events: [{
      id: 'evt1',
      date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      competitions: [{
        status: { type: { state } },
        competitors: [
          { homeAway: 'home', team: { displayName: 'AD Ceuta' } },
          { homeAway: 'away', team: { displayName: 'Rival FC' } },
        ],
        venue: { fullName: 'Alfonso Murube' },
      }],
    }],
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(logCron).mockResolvedValue(undefined)
  vi.mocked(getAllSubscriptions).mockResolvedValue([])
  vi.mocked(deleteSubscription).mockResolvedValue(undefined)
  vi.mocked(webpush.sendNotification).mockResolvedValue({ statusCode: 201 } as never)
})

describe('cron/match-day GET', () => {
  it('returns 405 in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = await GET(new NextRequest('http://localhost'))
    expect(res.status).toBe(405)
    vi.unstubAllEnvs()
  })

  it('returns match:none and sent:0 when no Ceuta event', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ events: [] }), { status: 200 })
    )
    const res = await GET(new NextRequest('http://localhost'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.match).toBe('none')
    expect(body.sent).toBe(0)
    expect(logCron).toHaveBeenCalledWith('match-day', 'success', expect.any(Number), { match: 'none', sent: 0 })
  })

  it('sends push when pre-match event found', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(makeScoreboard('pre')), { status: 200 })
    )
    vi.mocked(getAllSubscriptions).mockResolvedValue([sub])
    const res = await GET(new NextRequest('http://localhost'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.match).toBe('found')
    expect(body.sent).toBe(1)
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      expect.stringContaining('Rival FC')
    )
  })

  it('skips push when event is already in progress', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(makeScoreboard('in')), { status: 200 })
    )
    const res = await GET(new NextRequest('http://localhost'))
    const body = await res.json()
    expect(body.match).toBe('none') // state !== 'pre' → getTodayMatch returns null
    expect(webpush.sendNotification).not.toHaveBeenCalled()
  })

  it('logs error and rethrows on ESPN failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network'))
    await expect(GET(undefined as never)).rejects.toThrow('network')
    expect(logCron).toHaveBeenCalledWith('match-day', 'error', expect.any(Number), expect.any(Object))
  })
})

describe('cron/match-day POST', () => {
  it('returns 401 for invalid QStash signature', async () => {
    mockVerify.mockRejectedValue(new Error('bad sig'))
    const res = await POST(new NextRequest('http://localhost/api/cron/match-day', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(401)
  })

  it('runs and returns ok with valid signature', async () => {
    mockVerify.mockResolvedValue(true)
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ events: [] }), { status: 200 })
    )
    const res = await POST(new NextRequest('http://localhost/api/cron/match-day', {
      method: 'POST',
      headers: { 'Upstash-Signature': 'valid' },
      body: '{}',
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
