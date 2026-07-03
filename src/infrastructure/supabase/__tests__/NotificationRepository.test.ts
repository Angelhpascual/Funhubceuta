import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => ({ supabase: { from: vi.fn() } }))

import { supabase } from '../client'
import { getRecentNotifTitles, markNotifyQueued, getSubscriberCount } from '../NotificationRepository'

beforeEach(() => { vi.resetAllMocks() })

describe('getRecentNotifTitles', () => {
  it('returns array of article_title strings', async () => {
    const selectMock = vi.fn().mockReturnValue({
      gte: vi.fn().mockResolvedValue({ data: [{ article_title: 'Ceuta gana' }, { article_title: 'Empate' }] }),
    })
    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as never)

    const result = await getRecentNotifTitles('2026-01-01T00:00:00Z')
    expect(result).toEqual(['Ceuta gana', 'Empate'])
  })

  it('returns empty array when no data', async () => {
    const selectMock = vi.fn().mockReturnValue({
      gte: vi.fn().mockResolvedValue({ data: null }),
    })
    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as never)

    const result = await getRecentNotifTitles('2026-01-01T00:00:00Z')
    expect(result).toEqual([])
  })
})

describe('markNotifyQueued', () => {
  it('calls update with notify_queued: true on matching external_id', async () => {
    const eqMock = vi.fn().mockResolvedValue({})
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
    vi.mocked(supabase.from).mockReturnValue({ update: updateMock } as never)

    await markNotifyQueued('article-xyz')

    expect(updateMock).toHaveBeenCalledWith({ notify_queued: true })
    expect(eqMock).toHaveBeenCalledWith('external_id', 'article-xyz')
  })
})

describe('getSubscriberCount', () => {
  it('returns count from supabase', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({ count: 42 }),
    } as never)

    const result = await getSubscriberCount()
    expect(result).toBe(42)
  })

  it('returns 0 when count is null', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({ count: null }),
    } as never)

    const result = await getSubscriberCount()
    expect(result).toBe(0)
  })
})
