import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockVerify = vi.fn()
vi.mock('@upstash/qstash', () => ({
  Receiver: class {
    verify = mockVerify
  },
}))

import { verifyCronRequest } from '../auth'

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
  process.env.QSTASH_CURRENT_SIGNING_KEY = 'k1'
  process.env.QSTASH_NEXT_SIGNING_KEY = 'k2'
})

function makeReq(opts: { secret?: string; signature?: string; body?: string } = {}) {
  const url = opts.secret
    ? `http://localhost/api/cron/foo?secret=${opts.secret}`
    : 'http://localhost/api/cron/foo'
  const headers: Record<string, string> = {}
  if (opts.signature) headers['Upstash-Signature'] = opts.signature
  return new Request(url, { method: 'POST', headers, body: opts.body ?? '{}' })
}

describe('verifyCronRequest', () => {
  it('accepts a matching TEST_SECRET without checking the QStash signature at all', async () => {
    const result = await verifyCronRequest(makeReq({ secret: 'test-secret' }))
    expect(result).toBe(true)
    expect(mockVerify).not.toHaveBeenCalled()
  })

  it('falls through to QStash verification when the secret does not match', async () => {
    mockVerify.mockResolvedValue(true)
    const result = await verifyCronRequest(makeReq({ secret: 'wrong', signature: 'sig' }))
    expect(result).toBe(true)
    expect(mockVerify).toHaveBeenCalledWith({ signature: 'sig', body: '{}' })
  })

  it('falls through to QStash verification when there is no secret at all (the real scheduled cron)', async () => {
    mockVerify.mockResolvedValue(true)
    const result = await verifyCronRequest(makeReq({ signature: 'sig' }))
    expect(result).toBe(true)
  })

  it('returns false when QStash verification fails', async () => {
    mockVerify.mockResolvedValue(false)
    const result = await verifyCronRequest(makeReq({ signature: 'bad-sig' }))
    expect(result).toBe(false)
  })

  it('returns false (not throw) when QStash verification throws', async () => {
    mockVerify.mockRejectedValue(new Error('malformed signature'))
    const result = await verifyCronRequest(makeReq({ signature: 'garbage' }))
    expect(result).toBe(false)
  })

  it('passes an empty signature string to the verifier when the header is missing', async () => {
    mockVerify.mockResolvedValue(false)
    await verifyCronRequest(makeReq({}))
    expect(mockVerify).toHaveBeenCalledWith({ signature: '', body: '{}' })
  })
})
