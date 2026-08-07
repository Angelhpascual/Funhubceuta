import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/MvpRepository', () => ({
  getActiveMvpSession: vi.fn(),
  hasVoted: vi.fn(),
  castMvpVote: vi.fn(),
}))

import { getActiveMvpSession, hasVoted, castMvpVote } from '@/infrastructure/supabase/MvpRepository'
import { POST } from '../route'

beforeEach(() => { vi.resetAllMocks() })

let ipCounter = 0
function makeReq(body: unknown) {
  // Unique IP per request to avoid rate-limit interference between tests
  const ip = `10.0.0.${++ipCounter}`
  return new Request('http://localhost/api/mvp/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

describe('POST /api/mvp/vote', () => {
  it('returns 400 when missing fields', async () => {
    const res = await POST(makeReq({ sessionId: 's1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when session not active', async () => {
    vi.mocked(getActiveMvpSession).mockResolvedValue(null)
    const res = await POST(makeReq({ sessionId: 's1', candidateId: 'c1', fingerprint: 'fp1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when session id does not match', async () => {
    vi.mocked(getActiveMvpSession).mockResolvedValue({ id: 'other', status: 'open' } as never)
    const res = await POST(makeReq({ sessionId: 's1', candidateId: 'c1', fingerprint: 'fp1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when session not open', async () => {
    vi.mocked(getActiveMvpSession).mockResolvedValue({ id: 's1', status: 'closed' } as never)
    const res = await POST(makeReq({ sessionId: 's1', candidateId: 'c1', fingerprint: 'fp1' }))
    expect(res.status).toBe(400)
  })

  it('returns 409 when already voted', async () => {
    vi.mocked(getActiveMvpSession).mockResolvedValue({ id: 's1', status: 'open' } as never)
    vi.mocked(hasVoted).mockResolvedValue(true)
    const res = await POST(makeReq({ sessionId: 's1', candidateId: 'c1', fingerprint: 'fp1' }))
    expect(res.status).toBe(409)
  })

  it('casts vote and returns ok', async () => {
    vi.mocked(getActiveMvpSession).mockResolvedValue({ id: 's1', status: 'open' } as never)
    vi.mocked(hasVoted).mockResolvedValue(false)
    vi.mocked(castMvpVote).mockResolvedValue({ error: null })
    const res = await POST(makeReq({ sessionId: 's1', candidateId: 'c1', fingerprint: 'fp1' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(castMvpVote).toHaveBeenCalledWith('s1', 'c1', 'fp1')
  })

  it('returns 409 on duplicate key error from DB', async () => {
    vi.mocked(getActiveMvpSession).mockResolvedValue({ id: 's1', status: 'open' } as never)
    vi.mocked(hasVoted).mockResolvedValue(false)
    vi.mocked(castMvpVote).mockResolvedValue({ error: { code: '23505', message: 'duplicate' } } as never)
    const res = await POST(makeReq({ sessionId: 's1', candidateId: 'c1', fingerprint: 'fp1' }))
    expect(res.status).toBe(409)
  })

  it('returns 500 on other DB error', async () => {
    vi.mocked(getActiveMvpSession).mockResolvedValue({ id: 's1', status: 'open' } as never)
    vi.mocked(hasVoted).mockResolvedValue(false)
    vi.mocked(castMvpVote).mockResolvedValue({ error: { code: '99999', message: 'fail' } } as never)
    const res = await POST(makeReq({ sessionId: 's1', candidateId: 'c1', fingerprint: 'fp1' }))
    expect(res.status).toBe(500)
  })

  it('returns 429 when IP exceeds rate limit', async () => {
    const ip = '192.168.99.99'
    const makeIpReq = (body: unknown) => new Request('http://localhost/api/mvp/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    })
    // Exhaust rate limit (5 attempts)
    for (let i = 0; i < 5; i++) {
      await POST(makeIpReq({ sessionId: 's1', candidateId: 'c1', fingerprint: `fp${i}` }))
    }
    const res = await POST(makeIpReq({ sessionId: 's1', candidateId: 'c1', fingerprint: 'fp99' }))
    expect(res.status).toBe(429)
  })
})
