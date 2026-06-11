import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

beforeEach(() => {
  vi.restoreAllMocks()
})

function makeRequest(domain?: string): NextRequest {
  const url = domain
    ? `http://localhost/api/proxy/favicon?domain=${domain}`
    : 'http://localhost/api/proxy/favicon'
  return new NextRequest(url)
}

describe('GET /api/proxy/favicon', () => {
  it('returns 400 when domain is missing', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
  })

  it('returns 400 when domain contains a slash', async () => {
    const res = await GET(makeRequest('evil.com/path'))
    expect(res.status).toBe(400)
  })

  it('returns 400 when domain contains double dot', async () => {
    const res = await GET(makeRequest('..'))
    expect(res.status).toBe(400)
  })

  it('proxies favicon bytes with correct content-type', async () => {
    const fakeBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(fakeBuffer),
        headers: { get: () => 'image/png' },
      })
    )

    const res = await GET(makeRequest('marca.com'))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
    expect(res.headers.get('cache-control')).toMatch(/max-age=604800/)
  })

  it('returns 204 when upstream favicon fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    const res = await GET(makeRequest('nonexistent.example'))
    expect(res.status).toBe(204)
  })

  it('returns 204 when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))

    const res = await GET(makeRequest('nonexistent.example'))
    expect(res.status).toBe(204)
  })
})
