import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/MvpRepository', () => ({
  logMvpEvent: vi.fn(),
}))

import { logMvpEvent } from '@/infrastructure/supabase/MvpRepository'
import { POST } from '../route'

beforeEach(() => vi.resetAllMocks())

function makeReq(body: unknown) {
  return new Request('http://localhost/api/mvp/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/mvp/event', () => {
  it('returns 400 when sessionId missing', async () => {
    const res = await POST(makeReq({ event: 'banner_click' }))
    expect(res.status).toBe(400)
    expect(logMvpEvent).not.toHaveBeenCalled()
  })

  it('returns 400 when event missing', async () => {
    const res = await POST(makeReq({ sessionId: 'abc' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for disallowed event', async () => {
    const res = await POST(makeReq({ sessionId: 'abc', event: 'hack_attempt' }))
    expect(res.status).toBe(400)
  })

  it('logs event and returns ok', async () => {
    vi.mocked(logMvpEvent).mockResolvedValue(undefined)
    const res = await POST(makeReq({ sessionId: 'abc', event: 'vote_cast', fingerprint: 'fp123' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(logMvpEvent).toHaveBeenCalledWith('abc', 'vote_cast', 'fp123')
  })

  it('uses null fingerprint when not provided', async () => {
    vi.mocked(logMvpEvent).mockResolvedValue(undefined)
    await POST(makeReq({ sessionId: 'abc', event: 'sheet_open' }))
    expect(logMvpEvent).toHaveBeenCalledWith('abc', 'sheet_open', null)
  })

  it('returns 500 on error', async () => {
    vi.mocked(logMvpEvent).mockRejectedValue(new Error('DB error'))
    const res = await POST(makeReq({ sessionId: 'abc', event: 'banner_click' }))
    expect(res.status).toBe(500)
  })
})
