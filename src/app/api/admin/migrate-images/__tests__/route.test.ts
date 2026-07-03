import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/storage/imageUploader', () => ({
  downloadAndUploadImage: vi.fn(),
  isStoredNewsImage: vi.fn(),
  newsImageFilename: vi.fn(() => 'news/source/file.jpg'),
}))
vi.mock('@/infrastructure/rss/fetchOgImage', () => ({ fetchOgImage: vi.fn() }))
vi.mock('@/infrastructure/supabase/client', () => {
  const update = vi.fn()
  const eq = vi.fn()
  const range = vi.fn()
  const order = vi.fn()
  const select = vi.fn()
  const from = vi.fn()
  return { supabase: { from, __from: from, __select: select, __order: order, __range: range, __update: update, __eq: eq } }
})

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { downloadAndUploadImage, isStoredNewsImage } from '@/infrastructure/storage/imageUploader'
import { fetchOgImage } from '@/infrastructure/rss/fetchOgImage'
import { supabase } from '@/infrastructure/supabase/client'
import { POST } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom: ReturnType<typeof vi.fn> = (supabase as any).__from

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
  vi.mocked(isStoredNewsImage).mockReturnValue(false)
})

function makeChain(rows: unknown[], error: unknown = null) {
  const eq = vi.fn().mockResolvedValue({})
  const update = vi.fn().mockReturnValue({ eq })
  const range = vi.fn().mockResolvedValue({ data: rows, error })
  const order = vi.fn().mockReturnValue({ range })
  const select = vi.fn().mockReturnValue({ order })
  mockFrom.mockReturnValue({ select, update })
  return { select, order, range, update, eq }
}

function makeRequest(offset?: number) {
  return new Request('http://localhost/api/admin/migrate-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: offset !== undefined ? JSON.stringify({ offset }) : '{}',
  })
}

describe('POST /api/admin/migrate-images', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 500 on DB error', async () => {
    makeChain([], { message: 'DB error' })
    const res = await POST(makeRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('DB error')
  })

  it('skips already-stored images', async () => {
    vi.mocked(isStoredNewsImage).mockReturnValue(true)
    makeChain([{ id: '1', external_id: 'e1', source: 'faro', url: null, image_url: 'https://supabase.co/stored.jpg' }])
    const res = await POST(makeRequest())
    const body = await res.json()
    expect(body.skipped).toBe(1)
    expect(body.migrated).toBe(0)
    expect(downloadAndUploadImage).not.toHaveBeenCalled()
  })

  it('migrates images from external URLs', async () => {
    makeChain([{ id: '1', external_id: 'e1', source: 'faro', url: 'https://faro.es/news', image_url: 'https://faro.es/img.jpg' }])
    vi.mocked(downloadAndUploadImage).mockResolvedValue('https://supabase.co/stored.jpg')
    const res = await POST(makeRequest())
    const body = await res.json()
    expect(body.migrated).toBe(1)
    expect(body.failed).toBe(0)
  })

  it('fetches og:image when image_url is null', async () => {
    makeChain([{ id: '1', external_id: 'e1', source: 'faro', url: 'https://faro.es/news', image_url: null }])
    vi.mocked(fetchOgImage).mockResolvedValue('https://faro.es/og.jpg')
    vi.mocked(downloadAndUploadImage).mockResolvedValue('https://supabase.co/stored.jpg')
    const res = await POST(makeRequest())
    const body = await res.json()
    expect(fetchOgImage).toHaveBeenCalledWith('https://faro.es/news')
    expect(body.migrated).toBe(1)
  })

  it('counts failed when download returns null', async () => {
    makeChain([{ id: '1', external_id: 'e1', source: 'faro', url: null, image_url: 'https://faro.es/img.jpg' }])
    vi.mocked(downloadAndUploadImage).mockResolvedValue(null)
    const res = await POST(makeRequest())
    const body = await res.json()
    expect(body.failed).toBe(1)
    expect(body.migrated).toBe(0)
  })

  it('returns hasMore:true when batch is full', async () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      id: String(i), external_id: `e${i}`, source: 'faro', url: null, image_url: `https://faro.es/img${i}.jpg`,
    }))
    makeChain(rows)
    vi.mocked(downloadAndUploadImage).mockResolvedValue('https://supabase.co/stored.jpg')
    const res = await POST(makeRequest(0))
    const body = await res.json()
    expect(body.hasMore).toBe(true)
    expect(body.nextOffset).toBe(10)
  })
})
