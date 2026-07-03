import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock sharp so no native bindings needed in test
vi.mock('sharp', () => {
  const chain = {
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    avif: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('optimized-image')),
  }
  return { default: vi.fn(() => chain) }
})

import { GET } from '../route'
import { NextRequest } from 'next/server'

beforeEach(() => { vi.resetAllMocks() })

function makeRequest(url: string, accept = '') {
  return new NextRequest(`http://localhost/api/proxy/image?url=${encodeURIComponent(url)}`, {
    headers: { Accept: accept },
  })
}

function mockFetch(ok: boolean, contentType = 'image/jpeg') {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    new Response(Buffer.from('fake-image'), {
      status: ok ? 200 : 502,
      headers: { 'Content-Type': contentType },
    })
  )
}

describe('GET /api/proxy/image', () => {
  it('returns 400 when url param is missing', async () => {
    const res = await GET(new NextRequest('http://localhost/api/proxy/image'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid url', async () => {
    const res = await GET(new NextRequest('http://localhost/api/proxy/image?url=not-a-url'))
    expect(res.status).toBe(400)
  })

  it('returns 403 for disallowed domain', async () => {
    const res = await GET(makeRequest('https://evil.com/image.jpg'))
    expect(res.status).toBe(403)
  })

  it('proxies image from allowed domain', async () => {
    mockFetch(true, 'image/jpeg')
    const res = await GET(makeRequest('https://a.espncdn.com/photo.jpg'))
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toContain('max-age=604800')
  })

  it('returns 502 when upstream fetch fails', async () => {
    mockFetch(false)
    const res = await GET(makeRequest('https://a.espncdn.com/photo.jpg'))
    expect(res.status).toBe(502)
  })

  it('sets correct Content-Type from upstream', async () => {
    mockFetch(true, 'image/png')
    const req = new NextRequest(`http://localhost/api/proxy/image?url=${encodeURIComponent('https://a.espncdn.com/photo.png')}`)
    const res = await GET(req)
    expect(res.headers.get('Content-Type')).toBe('image/png')
  })
})
