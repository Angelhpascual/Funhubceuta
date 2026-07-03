import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/scrapers/twitterScraper', () => ({ scrapeLatestTweets: vi.fn() }))
vi.mock('@/infrastructure/supabase/TweetsRepository', () => ({ upsertTweets: vi.fn() }))
vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))
vi.mock('@upstash/qstash', () => {
  const verify = vi.fn()
  return {
    Receiver: class {
      verify = verify
      static __verify = verify
    },
  }
})

import { scrapeLatestTweets } from '@/infrastructure/scrapers/twitterScraper'
import { upsertTweets } from '@/infrastructure/supabase/TweetsRepository'
import { logCron } from '@/infrastructure/supabase/logCron'
import { Receiver } from '@upstash/qstash'
import { GET, POST } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockVerify: ReturnType<typeof vi.fn> = (Receiver as any).__verify

beforeEach(() => { vi.resetAllMocks() })

const tweet = { id: '1', text: 'Gol!', createdAt: '2026-05-01', url: 'https://x.com/1' }

describe('cron/tweets GET', () => {
  it('returns 405 in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = await GET()
    expect(res.status).toBe(405)
    vi.unstubAllEnvs()
  })

  it('returns count when tweets found', async () => {
    vi.mocked(scrapeLatestTweets).mockResolvedValue([tweet])
    vi.mocked(upsertTweets).mockResolvedValue(undefined)
    vi.mocked(logCron).mockResolvedValue(undefined)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.count).toBe(1)
  })

  it('logs 0 when scraper returns empty', async () => {
    vi.mocked(scrapeLatestTweets).mockResolvedValue([])
    vi.mocked(logCron).mockResolvedValue(undefined)
    const res = await GET()
    const body = await res.json()
    expect(body.count).toBe(0)
    expect(logCron).toHaveBeenCalledWith('tweets', 'success', expect.any(Number), { tweets: 0 })
  })
})

describe('cron/tweets POST', () => {
  it('returns 401 for invalid QStash signature', async () => {
    mockVerify.mockRejectedValue(new Error('bad sig'))
    const res = await POST(new Request('http://localhost/api/cron/tweets', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(401)
  })

  it('syncs tweets with valid signature', async () => {
    mockVerify.mockResolvedValue(true)
    vi.mocked(scrapeLatestTweets).mockResolvedValue([tweet])
    vi.mocked(upsertTweets).mockResolvedValue(undefined)
    vi.mocked(logCron).mockResolvedValue(undefined)
    const res = await POST(new Request('http://localhost/api/cron/tweets', {
      method: 'POST',
      headers: { 'Upstash-Signature': 'valid-sig' },
      body: '{}',
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
