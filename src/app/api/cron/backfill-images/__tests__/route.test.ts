import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))
vi.mock('@/infrastructure/storage/imageUploader', () => ({
  downloadAndUploadImage: vi.fn(),
  newsImageFilename: vi.fn(() => 'news/file.jpg'),
}))
vi.mock('@upstash/qstash', () => {
  const verify = vi.fn()
  return { Receiver: class { verify = verify; static __verify = verify } }
})
vi.mock('@/infrastructure/rss/fetchOgImage', () => ({ fetchOgImage: vi.fn().mockResolvedValue(null) }))
vi.mock('@/infrastructure/supabase/NewsSupabaseRepository', () => {
  const getRowsWithExternalImages = vi.fn()
  const getRowsWithoutImages = vi.fn()
  const updateImageUrlById = vi.fn()
  return {
    NewsSupabaseRepository: class {
      getRowsWithExternalImages = getRowsWithExternalImages
      getRowsWithoutImages = getRowsWithoutImages
      updateImageUrlById = updateImageUrlById
      static __getRows = getRowsWithExternalImages
      static __getRowsNoImage = getRowsWithoutImages
      static __updateById = updateImageUrlById
    },
  }
})

import { logCron } from '@/infrastructure/supabase/logCron'
import { downloadAndUploadImage } from '@/infrastructure/storage/imageUploader'
import { Receiver } from '@upstash/qstash'
import { NewsSupabaseRepository } from '@/infrastructure/supabase/NewsSupabaseRepository'
import { POST } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockVerify: ReturnType<typeof vi.fn> = (Receiver as any).__verify
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetRows: ReturnType<typeof vi.fn> = (NewsSupabaseRepository as any).__getRows
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetRowsNoImage: ReturnType<typeof vi.fn> = (NewsSupabaseRepository as any).__getRowsNoImage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpdateById: ReturnType<typeof vi.fn> = (NewsSupabaseRepository as any).__updateById

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(logCron).mockResolvedValue(undefined)
  mockGetRows.mockResolvedValue([])
  mockGetRowsNoImage.mockResolvedValue([])
  mockUpdateById.mockResolvedValue(undefined)
  process.env.TEST_SECRET = 'test-secret'
})

const row = { id: 'r1', externalId: 'e1', source: 'faro', imageUrl: 'https://faro.es/img.jpg' }

describe('cron/backfill-images POST', () => {
  it('returns 401 for invalid QStash signature', async () => {
    mockVerify.mockRejectedValue(new Error('bad'))
    const res = await POST(new Request('http://localhost/api/cron/backfill-images', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(401)
  })

  it('bypasses QStash with TEST_SECRET and returns optimized count', async () => {
    mockGetRows.mockResolvedValue([row])
    vi.mocked(downloadAndUploadImage).mockResolvedValue('https://supabase.co/stored.jpg')

    const res = await POST(new Request('http://localhost/api/cron/backfill-images?secret=test-secret', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.optimized).toBe(1)
    expect(mockUpdateById).toHaveBeenCalledWith('r1', 'https://supabase.co/stored.jpg')
  })

  it('returns 0 optimized when no rows with external images', async () => {
    mockGetRows.mockResolvedValue([])
    const res = await POST(new Request('http://localhost/api/cron/backfill-images?secret=test-secret', { method: 'POST', body: '{}' }))
    const body = await res.json()
    expect(body.optimized).toBe(0)
  })

  it('logs error and rethrows on failure', async () => {
    mockGetRows.mockRejectedValue(new Error('DB down'))
    await expect(
      POST(new Request('http://localhost/api/cron/backfill-images?secret=test-secret', { method: 'POST', body: '{}' }))
    ).rejects.toThrow('DB down')
    expect(logCron).toHaveBeenCalledWith('backfill-images', 'error', expect.any(Number), expect.any(Object))
  })
})
