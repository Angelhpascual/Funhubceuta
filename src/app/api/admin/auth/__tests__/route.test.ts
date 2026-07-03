import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  deriveToken: vi.fn((pw: string) => `token-${pw}`),
}))

import { POST } from '../route'

const ADMIN_PASSWORD = 'supersecret'

beforeEach(() => {
  vi.resetAllMocks()
  process.env.ADMIN_PASSWORD = ADMIN_PASSWORD
})

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/auth', () => {
  it('returns 401 for wrong password', async () => {
    const res = await POST(makeRequest({ password: 'wrong' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it('returns ok:true and sets cookie for correct password', async () => {
    const res = await POST(makeRequest({ password: ADMIN_PASSWORD }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    const cookie = res.headers.get('Set-Cookie')
    expect(cookie).toContain('admin_session')
    expect(cookie).toContain('HttpOnly')
  })

  it('returns 401 when ADMIN_PASSWORD env is not set', async () => {
    delete process.env.ADMIN_PASSWORD
    const res = await POST(makeRequest({ password: 'anything' }))
    expect(res.status).toBe(401)
  })

  it('sets cookie with correct token value', async () => {
    const res = await POST(makeRequest({ password: ADMIN_PASSWORD }))
    const cookie = res.headers.get('Set-Cookie') ?? ''
    expect(cookie).toContain(`token-${ADMIN_PASSWORD}`)
  })
})
