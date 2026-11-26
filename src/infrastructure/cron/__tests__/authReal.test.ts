// Uses the REAL QStash Receiver (no mock) with a JWT signed exactly as QStash
// signs deliveries, so a change in the signature format or a request body that
// reaches us altered shows up here instead of as 401s on every cron in prod.
import { describe, it, expect, beforeEach } from 'vitest'
import { createHmac, createHash } from 'node:crypto'
import { verifyCronRequest } from '../auth'

const CURRENT = 'current-signing-key'
const NEXT = 'next-signing-key'
const URL_ = 'https://example.com/api/cron/live'

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')

function sign(body: string, key: string, over: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: 'Upstash',
    sub: URL_,
    exp: now + 300,
    nbf: now - 10,
    iat: now,
    jti: 'jwt_1',
    body: createHash('sha256').update(body).digest('base64url'),
    ...over,
  }
  const head = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}`
  return `${head}.${createHmac('sha256', key).update(head).digest('base64url')}`
}

function req(body: string, signature: string) {
  return new Request(URL_, { method: 'POST', body, headers: { 'Upstash-Signature': signature } })
}

beforeEach(() => {
  delete process.env.TEST_SECRET
  process.env.QSTASH_CURRENT_SIGNING_KEY = CURRENT
  process.env.QSTASH_NEXT_SIGNING_KEY = NEXT
})

describe('verifyCronRequest with the real QStash Receiver', () => {
  const body = JSON.stringify({ chain: 'abc' })

  it('accepts a correctly signed delivery', async () => {
    expect(await verifyCronRequest(req(body, sign(body, CURRENT)))).toBe(true)
  })

  it('accepts a delivery signed with the next (rotated) key', async () => {
    expect(await verifyCronRequest(req(body, sign(body, NEXT)))).toBe(true)
  })

  it('rejects a body altered after signing', async () => {
    expect(await verifyCronRequest(req('{"chain":"evil"}', sign(body, CURRENT)))).toBe(false)
  })

  it('rejects an expired signature', async () => {
    const past = Math.floor(Date.now() / 1000) - 600
    expect(await verifyCronRequest(req(body, sign(body, CURRENT, { exp: past })))).toBe(false)
  })

  it('rejects a signature made with an unknown key', async () => {
    expect(await verifyCronRequest(req(body, sign(body, 'other-key')))).toBe(false)
  })

  it('answers false (not a 500) when the signing keys are not configured', async () => {
    delete process.env.QSTASH_CURRENT_SIGNING_KEY
    delete process.env.QSTASH_NEXT_SIGNING_KEY
    expect(await verifyCronRequest(req(body, sign(body, CURRENT)))).toBe(false)
  })
})
