import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/PredictionRepository', () => ({
  getActivePredictionSession: vi.fn(),
  getUserPrediction: vi.fn(),
}))

import { getActivePredictionSession, getUserPrediction } from '@/infrastructure/supabase/PredictionRepository'
import { GET } from '../route'

beforeEach(() => { vi.resetAllMocks() })

describe('GET /api/predictions/active', () => {
  it('returns null session when no active session', async () => {
    vi.mocked(getActivePredictionSession).mockResolvedValue(null)
    const req = new Request('http://localhost/api/predictions/active?fp=abc')
    const res = await GET(req)
    const body = await res.json()
    expect(body).toEqual({ session: null, mine: null })
  })

  it('does not cache the null-session response (regression: a 30s edge cache here could serve a stale {session:null} to the realtime-triggered fetch the instant a session opens, delaying the banner by up to 10 minutes)', async () => {
    vi.mocked(getActivePredictionSession).mockResolvedValue(null)
    const req = new Request('http://localhost/api/predictions/active')
    const res = await GET(req)
    expect(res.headers.get('Cache-Control')).toBeNull()
  })

  it('returns session and user prediction when fingerprint provided', async () => {
    const session = { id: 's1', status: 'open', match_label: 'Ceuta vs X' } as never
    const mine = { id: 'v1', home_score: 2, away_score: 0 } as never
    vi.mocked(getActivePredictionSession).mockResolvedValue(session)
    vi.mocked(getUserPrediction).mockResolvedValue(mine)

    const req = new Request('http://localhost/api/predictions/active?fp=fp1')
    const res = await GET(req)
    const body = await res.json()
    expect(body.session).toEqual(session)
    expect(body.mine).toEqual(mine)
    expect(getUserPrediction).toHaveBeenCalledWith('s1', 'fp1')
  })

  it('returns mine null when no fingerprint', async () => {
    const session = { id: 's1', status: 'open', match_label: 'Ceuta vs X' } as never
    vi.mocked(getActivePredictionSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/predictions/active')
    const res = await GET(req)
    const body = await res.json()
    expect(body.mine).toBeNull()
    expect(getUserPrediction).not.toHaveBeenCalled()
  })
})
