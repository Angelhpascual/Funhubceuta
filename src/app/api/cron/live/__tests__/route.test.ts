import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))
vi.mock('@/infrastructure/push/notifyAdmin', () => ({ notifyAdmin: vi.fn() }))
vi.mock('@/infrastructure/supabase/PushSubscriptionsRepository', () => ({
  getAllSubscriptions: vi.fn().mockResolvedValue([]),
  deleteSubscription: vi.fn(),
}))
vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({
  getConfig: vi.fn(),
  setConfig: vi.fn(),
  deleteConfig: vi.fn(),
}))
vi.mock('@/lib/fetchWithTimeout', () => ({ fetchWithTimeout: vi.fn() }))
vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}))

import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { getConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { getAllSubscriptions } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import { notifyAdmin } from '@/infrastructure/push/notifyAdmin'
import { GET } from '../route'

function scoreboardResponse(state: 'pre' | 'in' | 'post') {
  return new Response(JSON.stringify({
    events: [{
      id: 'evt1',
      date: '2026-09-20T18:30Z',
      competitions: [{
        status: { type: { state, description: state } },
        venue: { fullName: 'Alfonso Murube' },
        competitors: [
          { homeAway: 'home', team: { id: '5404', displayName: 'Ceuta' }, score: '2' },
          { homeAway: 'away', team: { id: '95', displayName: 'Real Valladolid' }, score: '1' },
        ],
      }],
    }],
  }), { status: 200 })
}

function summaryResponse() {
  return new Response(JSON.stringify({ plays: [] }), { status: 200 })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getAllSubscriptions).mockResolvedValue([])
  vi.mocked(notifyAdmin).mockResolvedValue(undefined)
  vi.mocked(getConfig).mockImplementation(async (key: string) => {
    if (key === 'live_match_state') {
      return JSON.stringify({ espnId: 'evt1', homeScore: 1, awayScore: 1, state: 'in', eventCount: 0 })
    }
    return null
  })
})

function makeReq(testMode = true) {
  return new Request(`http://localhost/api/cron/live${testMode ? '?test=true' : ''}`)
}

describe('GET /api/cron/live — match finished transition', () => {
  it('notifies the admin to open MVP voting when the match transitions to post', async () => {
    vi.mocked(fetchWithTimeout).mockImplementation(async (url: string | URL) => {
      if (String(url).includes('/summary')) return summaryResponse()
      return scoreboardResponse('post')
    })

    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    expect(notifyAdmin).toHaveBeenCalledWith('🏁 Partido terminado', 'Abre la votación MVP cuando tengas los candidatos')
  })

  it('does not notify while the match is still in progress', async () => {
    vi.mocked(fetchWithTimeout).mockImplementation(async (url: string | URL) => {
      if (String(url).includes('/summary')) return summaryResponse()
      return scoreboardResponse('in')
    })

    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    expect(notifyAdmin).not.toHaveBeenCalled()
  })
})
