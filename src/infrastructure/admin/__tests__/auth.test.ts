import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({ cookies: vi.fn() }))

import { cookies } from 'next/headers'
import { deriveToken, checkAdminAuth, unauthorizedResponse } from '../auth'

const PASSWORD = 'supersecret'

beforeEach(() => {
  vi.resetAllMocks()
  process.env.ADMIN_PASSWORD = PASSWORD
})

describe('deriveToken', () => {
  it('returns a 64-char hex string', () => {
    const token = deriveToken(PASSWORD)
    expect(token).toMatch(/^[a-f0-9]{64}$/)
  })

  it('is deterministic', () => {
    expect(deriveToken(PASSWORD)).toBe(deriveToken(PASSWORD))
  })

  it('differs for different passwords', () => {
    expect(deriveToken('a')).not.toBe(deriveToken('b'))
  })
})

describe('checkAdminAuth', () => {
  it('returns false when cookie is missing', async () => {
    vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as never)
    expect(await checkAdminAuth()).toBe(false)
  })

  it('returns false when cookie value is wrong', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) => name === 'admin_session' ? { value: 'bad-token' } : undefined,
    } as never)
    expect(await checkAdminAuth()).toBe(false)
  })

  it('returns true when cookie matches derived token', async () => {
    const token = deriveToken(PASSWORD)
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) => name === 'admin_session' ? { value: token } : undefined,
    } as never)
    expect(await checkAdminAuth()).toBe(true)
  })

  it('returns false when ADMIN_PASSWORD is not set', async () => {
    delete process.env.ADMIN_PASSWORD
    vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as never)
    expect(await checkAdminAuth()).toBe(false)
  })
})

describe('unauthorizedResponse', () => {
  it('returns 401 with error body', async () => {
    const res = unauthorizedResponse()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })
})
