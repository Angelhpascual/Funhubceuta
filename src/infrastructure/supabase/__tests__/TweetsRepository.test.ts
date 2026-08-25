import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => ({ supabase: { from: vi.fn() } }))
vi.mock('../adminClient', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { supabase } from '../client'
import { supabaseAdmin } from '../adminClient'
import { getLatestTweets, upsertTweets } from '../TweetsRepository'

beforeEach(() => { vi.resetAllMocks() })

function mockChain(data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data, error }),
    upsert: vi.fn().mockResolvedValue({ error }),
  }
  vi.mocked(supabase.from).mockReturnValue(chain as never)
  return chain
}

describe('getLatestTweets', () => {
  it('returns tweets from supabase', async () => {
    const tweets = [{ tweet_id: '1', text: 'Gol!', created_at_twitter: '2026-01-01', url: 'https://x.com/1', image_url: null }]
    mockChain(tweets)
    const result = await getLatestTweets(5)
    expect(result).toEqual(tweets)
    expect(supabase.from).toHaveBeenCalledWith('tweets')
  })

  it('returns empty array when supabase returns null', async () => {
    mockChain(null)
    const result = await getLatestTweets()
    expect(result).toEqual([])
  })
})

describe('upsertTweets', () => {
  it('does nothing for empty array', async () => {
    await upsertTweets([])
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
  })

  it('upserts tweets to supabase', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ upsert: upsertMock } as never)

    await upsertTweets([{ tweetId: '1', text: 'Hola', createdAt: '2026-01-01', url: 'https://x.com/1', imageUrl: null }])
    expect(upsertMock).toHaveBeenCalledWith(
      [{ tweet_id: '1', text: 'Hola', created_at_twitter: '2026-01-01', url: 'https://x.com/1', image_url: null }],
      { onConflict: 'tweet_id', ignoreDuplicates: true }
    )
  })

  it('throws when supabase returns error', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: { message: 'DB fail' } })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ upsert: upsertMock } as never)
    await expect(upsertTweets([{ tweetId: '1', text: 'x', createdAt: null, url: 'u', imageUrl: null }])).rejects.toThrow('DB fail')
  })
})
