import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/PredictionRepository', () => ({
  getActivePredictionSession: vi.fn(),
  upsertPrediction: vi.fn(),
}))

import { getActivePredictionSession, upsertPrediction } from '@/infrastructure/supabase/PredictionRepository'
import { POST } from '../route'

beforeEach(() => { vi.resetAllMocks() })

function makeReq(body: unknown) {
  return new Request('http://localhost/api/predictions/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/predictions/predict', () => {
  it('returns 400 when missing required fields', async () => {
    const res = await POST(makeReq({ sessionId: 's1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for out-of-range score', async () => {
    const res = await POST(makeReq({ sessionId: 's1', fingerprint: 'fp1', home: 10, away: 0 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for negative score', async () => {
    const res = await POST(makeReq({ sessionId: 's1', fingerprint: 'fp1', home: -1, away: 0 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for a non-integer score (regression: 5.5 passed the 0-9 range check untouched)', async () => {
    const res = await POST(makeReq({ sessionId: 's1', fingerprint: 'fp1', home: 5.5, away: 0 }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when session not found', async () => {
    vi.mocked(getActivePredictionSession).mockResolvedValue(null)
    const res = await POST(makeReq({ sessionId: 's1', fingerprint: 'fp1', home: 2, away: 1 }))
    expect(res.status).toBe(404)
  })

  it('returns 404 when session id does not match', async () => {
    vi.mocked(getActivePredictionSession).mockResolvedValue({ id: 'other', status: 'open' } as never)
    const res = await POST(makeReq({ sessionId: 's1', fingerprint: 'fp1', home: 2, away: 1 }))
    expect(res.status).toBe(404)
  })

  it('returns 400 when session is not open', async () => {
    vi.mocked(getActivePredictionSession).mockResolvedValue({ id: 's1', status: 'closed' } as never)
    const res = await POST(makeReq({ sessionId: 's1', fingerprint: 'fp1', home: 2, away: 1 }))
    expect(res.status).toBe(400)
  })

  it('saves prediction and returns ok', async () => {
    vi.mocked(getActivePredictionSession).mockResolvedValue({ id: 's1', status: 'open' } as never)
    vi.mocked(upsertPrediction).mockResolvedValue({ data: {}, error: null } as never)

    const res = await POST(makeReq({ sessionId: 's1', fingerprint: 'fp1', home: 2, away: 1, nickname: 'Tito' }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(upsertPrediction).toHaveBeenCalledWith('s1', 'fp1', 2, 1, 'Tito')
  })

  it('returns 500 on upsert error', async () => {
    vi.mocked(getActivePredictionSession).mockResolvedValue({ id: 's1', status: 'open' } as never)
    vi.mocked(upsertPrediction).mockResolvedValue({ data: null, error: { message: 'DB error' } } as never)

    const res = await POST(makeReq({ sessionId: 's1', fingerprint: 'fp1', home: 1, away: 0 }))
    expect(res.status).toBe(500)
  })
})
