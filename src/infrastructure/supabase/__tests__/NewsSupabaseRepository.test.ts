import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => ({ supabase: { from: vi.fn() } }))
vi.mock('../adminClient', () => ({ supabaseAdmin: { from: vi.fn() } }))

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

describe('upsertArticles', () => {
  it('inserts new articles with published=false even for oficial source (admin must approve)', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const inMock = vi.fn().mockResolvedValue({ data: [] }) // no existing
    const selectMock = vi.fn().mockReturnValue({ in: inMock })
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: selectMock,
      insert: insertMock,
    } as never)

    await repo.upsertArticles([makeArticle('abc', 'oficial')])

    expect(insertMock).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ published: false })])
    )
  })

  it('inserts new articles with published=false for non-auto sources', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const inMock = vi.fn().mockResolvedValue({ data: [] })
    const selectMock = vi.fn().mockReturnValue({ in: inMock })
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: selectMock,
      insert: insertMock,
    } as never)

    await repo.upsertArticles([makeArticle('xyz', 'faro')])

    expect(insertMock).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ published: false })])
    )
  })

  it('does NOT update published for existing articles', async () => {
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const inMock = vi.fn().mockResolvedValue({ data: [{ external_id: 'existing-1' }] })
    const selectMock = vi.fn().mockReturnValue({ in: inMock })
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: selectMock,
      update: updateMock,
    } as never)

    await repo.upsertArticles([makeArticle('existing-1', 'oficial')])

    // Should call update but NOT include published in the payload
    expect(updateMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ published: expect.anything() })
    )
  })

  it('does NOT update notify_queued for existing articles (preserves discard state)', async () => {
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const inMock = vi.fn().mockResolvedValue({ data: [{ external_id: 'discarded-1' }] })
    const selectMock = vi.fn().mockReturnValue({ in: inMock })
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: selectMock,
      update: updateMock,
    } as never)

    await repo.upsertArticles([makeArticle('discarded-1')])

    expect(updateMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ notify_queued: expect.anything() })
    )
  })

  it('does not re-insert discarded articles (published=false) visible via admin client', async () => {
    // Admin client sees ALL articles including discarded ones
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) })
    const inMock = vi.fn().mockResolvedValue({ data: [{ external_id: 'discarded-article' }] })
    const selectMock = vi.fn().mockReturnValue({ in: inMock })
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: selectMock,
      insert: insertMock,
      update: updateMock,
    } as never)

    const result = await repo.upsertArticles([makeArticle('discarded-article')])

    // Should NOT insert — article already exists
    expect(insertMock).not.toHaveBeenCalled()
    // Should return empty array (no new articles)
    expect(result).toHaveLength(0)
  })

  it('returns only new articles', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const inMock = vi.fn().mockResolvedValue({ data: [{ external_id: 'old' }] })
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) })
    const selectMock = vi.fn().mockReturnValue({ in: inMock })
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: selectMock,
      insert: insertMock,
      update: updateMock,
    } as never)

    const result = await repo.upsertArticles([
      makeArticle('old'),
      makeArticle('new'),
    ])

    expect(result).toHaveLength(1)
    expect(result[0].externalId).toBe('new')
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
