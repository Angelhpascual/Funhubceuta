import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/rss/sources', () => ({ RSS_SOURCES: [] }))
vi.mock('@/infrastructure/rss/RssFetcher', () => ({ fetchSource: vi.fn() }))
vi.mock('@/infrastructure/rss/adceutaFetcher', () => ({ fetchAdceutaOfficialNews: vi.fn() }))
vi.mock('@/infrastructure/rss/ceutadeportivaFetcher', () => ({ fetchCeutaDeportiva: vi.fn() }))
vi.mock('@/infrastructure/rss/fetchOgImage', () => ({ fetchOgImage: vi.fn() }))
vi.mock('@/infrastructure/push/sendNewsNotification', () => ({ sendNewsNotification: vi.fn() }))
vi.mock('@/infrastructure/push/notifyAdmin', () => ({ notifyAdmin: vi.fn() }))
vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn(), logNotification: vi.fn() }))
vi.mock('@/infrastructure/supabase/NotificationRepository', () => ({
  getRecentNotifTitles: vi.fn(),
  markNotifyQueued: vi.fn(),
  getSubscriberCount: vi.fn(),
}))
vi.mock('@/infrastructure/storage/imageUploader', () => ({
  downloadAndUploadImage: vi.fn(),
  isStoredNewsImage: vi.fn(() => false),
  newsImageFilename: vi.fn(() => 'news/file.jpg'),
}))
vi.mock('@upstash/qstash', () => {
  const verify = vi.fn()
  return { Receiver: class { verify = verify; static __verify = verify } }
})
vi.mock('@/infrastructure/supabase/NewsSupabaseRepository', () => {
  const upsertArticles = vi.fn()
  const updateImageUrl = vi.fn()
  const updateImageUrlById = vi.fn()
  const getLatestRowsWithImages = vi.fn()
  return {
    NewsSupabaseRepository: class {
      upsertArticles = upsertArticles
      updateImageUrl = updateImageUrl
      updateImageUrlById = updateImageUrlById
      getLatestRowsWithImages = getLatestRowsWithImages
      static __upsertArticles = upsertArticles
      static __getLatestRowsWithImages = getLatestRowsWithImages
    },
  }
})

import { fetchAdceutaOfficialNews } from '@/infrastructure/rss/adceutaFetcher'
import { fetchCeutaDeportiva } from '@/infrastructure/rss/ceutadeportivaFetcher'
import { logCron } from '@/infrastructure/supabase/logCron'
import { getRecentNotifTitles, markNotifyQueued, getSubscriberCount } from '@/infrastructure/supabase/NotificationRepository'
import { notifyAdmin } from '@/infrastructure/push/notifyAdmin'
import { Receiver } from '@upstash/qstash'
import { NewsSupabaseRepository } from '@/infrastructure/supabase/NewsSupabaseRepository'
import { GET, POST } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockVerify: ReturnType<typeof vi.fn> = (Receiver as any).__verify
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpsertArticles: ReturnType<typeof vi.fn> = (NewsSupabaseRepository as any).__upsertArticles
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetLatestRowsWithImages: ReturnType<typeof vi.fn> = (NewsSupabaseRepository as any).__getLatestRowsWithImages

const article = {
  externalId: 'a1', title: 'Ceuta consigue victoria importante frente Barcelona', source: 'oficial',
  url: 'https://adceuta.com/1', imageUrl: null, publishedAt: new Date().toISOString(), description: null,
}

beforeEach(() => {
  vi.resetAllMocks()
  mockUpsertArticles.mockResolvedValue([])
  mockGetLatestRowsWithImages.mockResolvedValue([])
  vi.mocked(fetchAdceutaOfficialNews).mockResolvedValue([])
  vi.mocked(fetchCeutaDeportiva).mockResolvedValue([])
  vi.mocked(logCron).mockResolvedValue(undefined)
  vi.mocked(getRecentNotifTitles).mockResolvedValue([])
  vi.mocked(markNotifyQueued).mockResolvedValue(undefined)
  vi.mocked(getSubscriberCount).mockResolvedValue(0)
  vi.mocked(notifyAdmin).mockResolvedValue(undefined)
  process.env.TEST_SECRET = 'test-secret'
})

describe('cron/news GET', () => {
  it('returns 405 in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = await GET(new Request('http://localhost/api/cron/news'))
    expect(res.status).toBe(405)
    vi.unstubAllEnvs()
  })

  it('syncs news and returns ok', async () => {
    const res = await GET(new Request('http://localhost/api/cron/news'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(logCron).toHaveBeenCalledWith('news', 'success', expect.any(Number), expect.any(Object))
  })

  it('queues notification for new recent article', async () => {
    vi.mocked(fetchAdceutaOfficialNews).mockResolvedValue([article])
    mockUpsertArticles.mockResolvedValue([article])

    const res = await GET(new Request('http://localhost/api/cron/news'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.queued).toBe(article.title)
    expect(markNotifyQueued).toHaveBeenCalledWith(article.externalId)
    expect(notifyAdmin).toHaveBeenCalled()
  })

  it('skips notification when title matches recent sent', async () => {
    vi.mocked(fetchAdceutaOfficialNews).mockResolvedValue([article])
    mockUpsertArticles.mockResolvedValue([article])
    // Same article title in recent titles → should deduplicate
    vi.mocked(getRecentNotifTitles).mockResolvedValue([article.title])

    await GET(new Request('http://localhost/api/cron/news'))
    expect(markNotifyQueued).not.toHaveBeenCalled()
  })

  it('skips notification for article with null publishedAt (no date = not recent)', async () => {
    const noDate = { ...article, publishedAt: null }
    vi.mocked(fetchAdceutaOfficialNews).mockResolvedValue([noDate])
    mockUpsertArticles.mockResolvedValue([noDate])

    await GET(new Request('http://localhost/api/cron/news'))
    expect(markNotifyQueued).not.toHaveBeenCalled()
  })
})

describe('cron/news POST', () => {
  it('returns 401 for invalid QStash signature', async () => {
    mockVerify.mockRejectedValue(new Error('bad'))
    const res = await POST(new Request('http://localhost/api/cron/news', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(401)
  })

  it('bypasses QStash with TEST_SECRET', async () => {
    const res = await POST(new Request('http://localhost/api/cron/news?secret=test-secret', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(200)
    expect(mockVerify).not.toHaveBeenCalled()
  })
})
