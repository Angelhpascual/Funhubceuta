import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => ({ supabase: { from: vi.fn() } }))
vi.mock('../adminClient', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { supabase } from '../client'
import { supabaseAdmin } from '../adminClient'
import { NewsSupabaseRepository } from '../NewsSupabaseRepository'

const repo = new NewsSupabaseRepository()

beforeEach(() => { vi.resetAllMocks() })

const makeArticle = (externalId: string, source = 'faro') => ({
  externalId,
  title: 'Test',
  description: 'desc',
  url: 'https://x.com',
  imageUrl: null,
  source,
  publishedAt: '2026-07-01',
})

// upsertArticles makes two separate `.from('news')` calls (a SELECT to build
// existingMap, then an upsert-with-ignoreDuplicates to insert atomically),
// so the mock must route each `.from()` call to its own chain depending on
// which method gets invoked on it, rather than one fixed return value.
function mockNewsFrom(opts: {
  existingRows?: Array<{ external_id: string; image_url?: string | null }>
  insertedExternalIds?: string[]
}) {
  const { existingRows = [], insertedExternalIds = [] } = opts
  const inMock = vi.fn().mockResolvedValue({ data: existingRows })
  const selectForIn = vi.fn().mockReturnValue({ in: inMock })
  const upsertSelectMock = vi.fn().mockResolvedValue({
    data: insertedExternalIds.map((external_id) => ({ external_id })),
    error: null,
  })
  const upsertMock = vi.fn().mockReturnValue({ select: upsertSelectMock })
  const eqMock = vi.fn().mockResolvedValue({ error: null })
  const updateMock = vi.fn().mockReturnValue({ eq: eqMock })

  vi.mocked(supabaseAdmin.from).mockImplementation(() => ({
    select: selectForIn,
    upsert: upsertMock,
    update: updateMock,
  }) as never)

  return { inMock, upsertMock, upsertSelectMock, updateMock, eqMock }
}

describe('upsertArticles', () => {
  it('inserts new articles with published=false even for oficial source (admin must approve)', async () => {
    const { upsertMock } = mockNewsFrom({ insertedExternalIds: ['abc'] })

    await repo.upsertArticles([makeArticle('abc', 'oficial')])

    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ published: false })]),
      { onConflict: 'external_id', ignoreDuplicates: true }
    )
  })

  it('inserts new articles with published=false for non-auto sources', async () => {
    const { upsertMock } = mockNewsFrom({ insertedExternalIds: ['xyz'] })

    await repo.upsertArticles([makeArticle('xyz', 'faro')])

    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ published: false })]),
      { onConflict: 'external_id', ignoreDuplicates: true }
    )
  })

  it('does NOT update published for existing articles', async () => {
    // Not in insertedExternalIds → ignoreDuplicates skipped it → treated as existing
    const { updateMock } = mockNewsFrom({ existingRows: [{ external_id: 'existing-1' }] })

    await repo.upsertArticles([makeArticle('existing-1', 'oficial')])

    expect(updateMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ published: expect.anything() })
    )
  })

  it('does NOT update notify_queued for existing articles (preserves discard state)', async () => {
    const { updateMock } = mockNewsFrom({ existingRows: [{ external_id: 'discarded-1' }] })

    await repo.upsertArticles([makeArticle('discarded-1')])

    expect(updateMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ notify_queued: expect.anything() })
    )
  })

  it('does not re-insert discarded articles (published=false) visible via admin client', async () => {
    // Admin client sees ALL articles including discarded ones — the upsert's
    // ON CONFLICT DO NOTHING means it's a no-op, so this external_id never
    // appears in the returned (inserted) rows.
    mockNewsFrom({ existingRows: [{ external_id: 'discarded-article' }] })

    const result = await repo.upsertArticles([makeArticle('discarded-article')])

    expect(result).toHaveLength(0)
  })

  it('returns only articles the upsert actually inserted (regression: used to be decided by a separate, racy pre-check SELECT)', async () => {
    mockNewsFrom({
      existingRows: [{ external_id: 'old' }],
      insertedExternalIds: ['new'],
    })

    const result = await repo.upsertArticles([
      makeArticle('old'),
      makeArticle('new'),
    ])

    expect(result).toHaveLength(1)
    expect(result[0].externalId).toBe('new')
  })

  it('throws when the upsert reports an error', async () => {
    const { upsertMock } = mockNewsFrom({})
    upsertMock.mockReturnValue({ select: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }) })

    await expect(repo.upsertArticles([makeArticle('err')])).rejects.toThrow('Failed to insert news: boom')
  })
})

describe('getRowsWithExternalImages', () => {
  it('excludes rows older than 3 days (regression: retried the same permanently-unreachable laverdaddeceuta.com URLs every 6h forever — 877 error rows for ~10 distinct URLs — with no cutoff)', async () => {
    const gteMock = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [] }) }),
    })
    const notImageUrlMock = vi.fn().mockReturnValue({ gte: gteMock })
    const notNullMock = vi.fn().mockReturnValue({ not: notImageUrlMock })
    const selectMock = vi.fn().mockReturnValue({ not: notNullMock })
    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as never)

    await repo.getRowsWithExternalImages()

    const [cutoffArg] = gteMock.mock.calls[0]
    expect(cutoffArg).toBe('created_at')
    const [, cutoffValue] = gteMock.mock.calls[0]
    const cutoffDate = new Date(cutoffValue as string)
    const ageMs = Date.now() - cutoffDate.getTime()
    // cutoff should be ~3 days ago, not e.g. epoch/unset
    expect(ageMs).toBeGreaterThan(2.9 * 24 * 60 * 60 * 1000)
    expect(ageMs).toBeLessThan(3.1 * 24 * 60 * 60 * 1000)
  })
})

describe('getAdminList', () => {
  function makeAdminListMock(data: unknown[] | null) {
    const limitMock = vi.fn().mockResolvedValue({ data })
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock })
    const eqMock = vi.fn().mockReturnValue({ order: orderMock })
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ select: selectMock } as never)
    return { limitMock, orderMock, eqMock }
  }

  it('returns list of news items with admin fields', async () => {
    const data = [
      { id: '1', title: 'Ceuta gana', source: 'oficial', published_at: '2026-05-01', image_url: null, url: 'https://x.com' },
      { id: '2', title: 'Empate', source: 'faro', published_at: '2026-04-30', image_url: 'https://img.com/1.jpg', url: 'https://y.com' },
    ]
    const { limitMock, orderMock, eqMock } = makeAdminListMock(data)

    const result = await repo.getAdminList()

    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Ceuta gana')
    expect(eqMock).toHaveBeenCalledWith('discarded', false)
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(limitMock).toHaveBeenCalledWith(100)
  })

  it('returns empty array when no data', async () => {
    makeAdminListMock(null)
    const result = await repo.getAdminList()
    expect(result).toEqual([])
  })

  it('respects custom limit', async () => {
    const { limitMock } = makeAdminListMock([])
    await repo.getAdminList(50)
    expect(limitMock).toHaveBeenCalledWith(50)
  })
})
