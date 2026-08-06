import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/TransfersRepository', () => ({
  getTransfersWithExternalPhotos: vi.fn(),
  updateTransferPhotoUrl: vi.fn(),
}))
vi.mock('@/infrastructure/storage/imageUploader', () => ({
  downloadAndUploadImage: vi.fn(),
  PLAYER_BUCKET: 'player-photos',
}))
vi.mock('@/infrastructure/supabase/logCron', () => ({
  logCron: vi.fn(),
}))
vi.mock('@/infrastructure/cron/auth', () => ({
  checkCronAuth: vi.fn(),
  cronUnauthorized: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))

import { getTransfersWithExternalPhotos, updateTransferPhotoUrl } from '@/infrastructure/supabase/TransfersRepository'
import { downloadAndUploadImage } from '@/infrastructure/storage/imageUploader'
import { checkCronAuth } from '@/infrastructure/cron/auth'
import { POST } from '../route'

function makeReq(secret?: string) {
  const url = secret
    ? `http://localhost/api/cron/backfill-transfer-photos?secret=${secret}`
    : 'http://localhost/api/cron/backfill-transfer-photos'
  return new Request(url, { method: 'POST', headers: { authorization: 'Bearer cron-secret' } })
}

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
  vi.mocked(checkCronAuth).mockReturnValue(true)
})

describe('POST /api/cron/backfill-transfer-photos', () => {
  it('returns 401 when cron auth fails', async () => {
    vi.mocked(checkCronAuth).mockReturnValue(false)
    const res = await POST(makeReq('test-secret'))
    expect(res.status).toBe(401)
  })

  it('returns 401 without TEST_SECRET even with cron auth', async () => {
    vi.mocked(getTransfersWithExternalPhotos).mockResolvedValue([])
    const res = await POST(makeReq())
    expect(res.status).toBe(401)
  })

  it('processes transfers and returns counts', async () => {
    const transfers = [
      { id: 1, photo_url: 'https://external.com/p1.jpg' },
      { id: 2, photo_url: 'https://external.com/p2.jpg' },
    ]
    vi.mocked(getTransfersWithExternalPhotos).mockResolvedValue(transfers as never)
    vi.mocked(downloadAndUploadImage).mockResolvedValue('https://supabase.co/stored/p1.jpg')
    vi.mocked(updateTransferPhotoUrl).mockResolvedValue(undefined)

    const res = await POST(makeReq('test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.pending).toBe(2)
    expect(body.optimized).toBe(2)
    expect(body.failed).toBe(0)
  })

  it('counts failures when upload returns null', async () => {
    vi.mocked(getTransfersWithExternalPhotos).mockResolvedValue([
      { id: 1, photo_url: 'https://ext.com/bad.jpg' },
    ] as never)
    vi.mocked(downloadAndUploadImage).mockResolvedValue(null)

    const res = await POST(makeReq('test-secret'))
    const body = await res.json()
    expect(body.failed).toBe(1)
    expect(body.optimized).toBe(0)
    expect(body.errors).toHaveLength(1)
  })

  it('counts failures on upload error', async () => {
    vi.mocked(getTransfersWithExternalPhotos).mockResolvedValue([
      { id: 3, photo_url: 'https://ext.com/err.jpg' },
    ] as never)
    vi.mocked(downloadAndUploadImage).mockRejectedValue(new Error('Network error'))

    const res = await POST(makeReq('test-secret'))
    const body = await res.json()
    expect(body.failed).toBe(1)
    expect(body.errors[0]).toContain('3:')
  })

  it('respects BATCH_SIZE limit (15)', async () => {
    const transfers = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, photo_url: `https://ext.com/${i}.jpg` }))
    vi.mocked(getTransfersWithExternalPhotos).mockResolvedValue(transfers as never)
    vi.mocked(downloadAndUploadImage).mockResolvedValue('https://stored.url')

    const res = await POST(makeReq('test-secret'))
    const body = await res.json()
    expect(body.pending).toBe(20)
    expect(body.optimized).toBe(15)
  })
})
