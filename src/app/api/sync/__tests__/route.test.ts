import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
})

function mockAllFetch() {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), { status: 200 })
  )
}

import { GET, POST } from '../route'

describe('GET /api/sync', () => {
  it('returns 401 in production without secret', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = await GET(new Request('http://localhost/api/sync'))
    expect(res.status).toBe(401)
    vi.unstubAllEnvs()
  })

  it('runs all scrapers and returns combined results', async () => {
    mockAllFetch()
    const res = await GET(new Request('http://localhost/api/sync'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.results).toHaveProperty('standings')
    expect(body.results).toHaveProperty('news')
    expect(body.results).toHaveProperty('matches')
    expect(body.results).toHaveProperty('stats')
  })

  it('records error per step without crashing on fetch failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network'))
    const res = await GET(new Request('http://localhost/api/sync'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.results.standings).toHaveProperty('error')
  })
})

describe('POST /api/sync', () => {
  it('returns same shape as GET', async () => {
    mockAllFetch()
    const res = await POST(new Request('http://localhost/api/sync', { method: 'POST' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
