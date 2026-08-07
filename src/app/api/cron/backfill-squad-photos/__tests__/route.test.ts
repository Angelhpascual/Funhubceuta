import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/constants', () => ({ CURRENT_SEASON: '2526' }))
vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))
vi.mock('@/infrastructure/cron/auth', () => ({
  checkCronAuth: vi.fn().mockReturnValue(true),
  cronUnauthorized: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/supabase/SquadSupabaseRepository', () => ({
  getPlayersWithExternalPhotos: vi.fn(),
  updatePlayerPhotoUrl: vi.fn(),
}))
vi.mock('@/infrastructure/storage/imageUploader', () => ({
  downloadAndUploadImage: vi.fn(),
  PLAYER_BUCKET: 'player-photos',
}))

import { getPlayersWithExternalPhotos, updatePlayerPhotoUrl } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { downloadAndUploadImage } from '@/infrastructure/storage/imageUploader'
import { logCron } from '@/infrastructure/supabase/logCron'
import { checkCronAuth } from '@/infrastructure/cron/auth'
import { GET, POST } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkCronAuth).mockReturnValue(true)
  vi.mocked(getPlayersWithExternalPhotos).mockResolvedValue([])
  vi.mocked(updatePlayerPhotoUrl).mockResolvedValue(undefined)
  vi.mocked(downloadAndUploadImage).mockResolvedValue(null)
  vi.mocked(logCron).mockResolvedValue(undefined)
  process.env.TEST_SECRET = 'test-secret'
})

describe('GET /api/cron/backfill-squad-photos', () => {
  it('returns 405 in production without secret', async () => {
    vi.mocked(checkCronAuth).mockReturnValue(true)
    vi.stubEnv('NODE_ENV', 'production')
    const res = await GET(new NextRequest('http://localhost/api/cron/backfill-squad-photos'))
    expect(res.status).toBe(405)
    vi.unstubAllEnvs()
  })

  it('returns ok with zero pending when no players to process', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/backfill-squad-photos?secret=test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.pending).toBe(0)
    expect(body.optimized).toBe(0)
  })

  it('downloads and stores photo for each player', async () => {
    const players = [
      { id: 'p1', photo_url: 'https://assets.laliga.com/p1.png' },
      { id: 'p2', photo_url: 'https://assets.laliga.com/p2.png' },
    ]
    vi.mocked(getPlayersWithExternalPhotos).mockResolvedValue(players)
    vi.mocked(downloadAndUploadImage).mockResolvedValue('https://onguesyapdtatsadsxmc.supabase.co/storage/v1/object/public/player-photos/players/p1.webp')

    const res = await GET(new NextRequest('http://localhost/api/cron/backfill-squad-photos?secret=test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.optimized).toBe(2)
    expect(body.failed).toBe(0)
    expect(updatePlayerPhotoUrl).toHaveBeenCalledTimes(2)
  })

  it('counts failed when download returns null', async () => {
    vi.mocked(getPlayersWithExternalPhotos).mockResolvedValue([
      { id: 'p1', photo_url: 'https://assets.laliga.com/p1.png' },
    ])
    vi.mocked(downloadAndUploadImage).mockResolvedValue(null)

    const res = await GET(new NextRequest('http://localhost/api/cron/backfill-squad-photos?secret=test-secret'))
    const body = await res.json()
    expect(body.failed).toBe(1)
    expect(body.optimized).toBe(0)
    expect(updatePlayerPhotoUrl).not.toHaveBeenCalled()
  })
})

describe('POST /api/cron/backfill-squad-photos', () => {
  it('runs backfill and returns ok', async () => {
    const res = await POST(new NextRequest('http://localhost', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
