import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/NewsSupabaseRepository', () => {
  const getLatest = vi.fn()
  return {
    NewsSupabaseRepository: class {
      getLatest = getLatest
      static __getLatest = getLatest
    },
  }
})
vi.mock('@/lib/decodeEntities', () => ({ decodeEntities: (s: string) => s }))

import { NewsSupabaseRepository } from '@/infrastructure/supabase/NewsSupabaseRepository'
import { GET } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetLatest: ReturnType<typeof vi.fn> = (NewsSupabaseRepository as any).__getLatest

function makeRequest(params = '') {
  return new Request(`http://localhost/api/news${params}`)
}

beforeEach(() => { mockGetLatest.mockReset() })

describe('GET /api/news', () => {
  it('returns news array', async () => {
    mockGetLatest.mockResolvedValue([
      { id: '1', title: 'Ceuta gana', source: 'oficial', url: 'https://x.com', imageUrl: null, publishedAt: '2026-01-01' },
    ])
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.news).toHaveLength(1)
    expect(body.news[0].title).toBe('Ceuta gana')
  })

  it('caps limit at 50', async () => {
    mockGetLatest.mockResolvedValue([])
    await GET(makeRequest('?limit=999'))
    expect(mockGetLatest).toHaveBeenCalledWith(50, 0)
  })

  it('clamps negative offset to 0', async () => {
    mockGetLatest.mockResolvedValue([])
    await GET(makeRequest('?offset=-5'))
    expect(mockGetLatest).toHaveBeenCalledWith(10, 0)
  })

  it('sets Cache-Control header', async () => {
    mockGetLatest.mockResolvedValue([])
    const res = await GET(makeRequest())
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=60')
  })

  it('returns 500 when repo throws', async () => {
    mockGetLatest.mockRejectedValue(new Error('DB down'))
    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('DB down')
  })
})
