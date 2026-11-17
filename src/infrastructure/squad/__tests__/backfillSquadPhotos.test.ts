import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/SquadSupabaseRepository', () => ({
  getPlayersWithExternalPhotos: vi.fn(),
  updatePlayerPhotoUrl: vi.fn(),
}))
vi.mock('@/infrastructure/storage/imageUploader', () => ({
  downloadAndUploadImage: vi.fn(),
  PLAYER_BUCKET: 'player-photos',
}))
vi.mock('@/lib/constants', () => ({ CURRENT_SEASON: '2026-2027' }))

import {
  getPlayersWithExternalPhotos,
  updatePlayerPhotoUrl,
} from '@/infrastructure/supabase/SquadSupabaseRepository'
import { downloadAndUploadImage } from '@/infrastructure/storage/imageUploader'
import { backfillSquadPhotos } from '../backfillSquadPhotos'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('backfillSquadPhotos', () => {
  it('derives the storage filename from a hash of the source URL, not a bare player id (regression: a 1-year Cache-Control on a path reused as-is meant a changed source photo never invalidated the CDN/browser cache)', async () => {
    vi.mocked(getPlayersWithExternalPhotos).mockResolvedValue([
      { id: 'player-1', photo_url: 'https://adceutafc.com/wp-content/uploads/9_test.webp' },
    ])
    vi.mocked(downloadAndUploadImage).mockResolvedValue('https://x.supabase.co/stored.webp')
    vi.mocked(updatePlayerPhotoUrl).mockResolvedValue(undefined)

    await backfillSquadPhotos()

    expect(downloadAndUploadImage).toHaveBeenCalledWith(
      'https://adceutafc.com/wp-content/uploads/9_test.webp',
      expect.stringMatching(/^players\/player-1-[0-9a-f]{10}$/),
      expect.objectContaining({ bucket: 'player-photos' })
    )
  })

  it('produces a different filename when the source URL changes for the same player', async () => {
    vi.mocked(downloadAndUploadImage).mockResolvedValue('https://x.supabase.co/stored.webp')
    vi.mocked(updatePlayerPhotoUrl).mockResolvedValue(undefined)

    vi.mocked(getPlayersWithExternalPhotos).mockResolvedValue([
      { id: 'player-1', photo_url: 'https://laliga.com/old.webp' },
    ])
    await backfillSquadPhotos()
    const firstFilename = vi.mocked(downloadAndUploadImage).mock.calls[0][1]

    vi.mocked(downloadAndUploadImage).mockClear()
    vi.mocked(getPlayersWithExternalPhotos).mockResolvedValue([
      { id: 'player-1', photo_url: 'https://adceutafc.com/new.webp' },
    ])
    await backfillSquadPhotos()
    const secondFilename = vi.mocked(downloadAndUploadImage).mock.calls[0][1]

    expect(firstFilename).not.toBe(secondFilename)
  })

  it('counts successes and failures, reporting pending as the full list before batching', async () => {
    vi.mocked(getPlayersWithExternalPhotos).mockResolvedValue([
      { id: 'a', photo_url: 'https://x.com/a.webp' },
      { id: 'b', photo_url: 'https://x.com/b.webp' },
    ])
    vi.mocked(downloadAndUploadImage)
      .mockResolvedValueOnce('https://x.supabase.co/a.webp')
      .mockResolvedValueOnce(null)
    vi.mocked(updatePlayerPhotoUrl).mockResolvedValue(undefined)

    const result = await backfillSquadPhotos()

    expect(result).toEqual({ pending: 2, optimized: 1, failed: 1 })
  })
})
