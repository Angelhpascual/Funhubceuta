import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => ({ supabase: { from: vi.fn() } }))

import { supabase } from '../client'
import { NewsSupabaseRepository } from '../NewsSupabaseRepository'

const repo = new NewsSupabaseRepository()

beforeEach(() => { vi.resetAllMocks() })

describe('getAdminList', () => {
  it('returns list of news items with admin fields', async () => {
    const data = [
      { id: '1', title: 'Ceuta gana', source: 'oficial', published_at: '2026-05-01', image_url: null, url: 'https://x.com' },
      { id: '2', title: 'Empate', source: 'faro', published_at: '2026-04-30', image_url: 'https://img.com/1.jpg', url: 'https://y.com' },
    ]
    const limitMock = vi.fn().mockResolvedValue({ data })
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock })
    const selectMock = vi.fn().mockReturnValue({ order: orderMock })
    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as never)

    const result = await repo.getAdminList()

    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Ceuta gana')
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(limitMock).toHaveBeenCalledWith(100)
  })

  it('returns empty array when no data', async () => {
    const limitMock = vi.fn().mockResolvedValue({ data: null })
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: limitMock }) }),
    } as never)

    const result = await repo.getAdminList()
    expect(result).toEqual([])
  })

  it('respects custom limit', async () => {
    const limitMock = vi.fn().mockResolvedValue({ data: [] })
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: limitMock }) }),
    } as never)

    await repo.getAdminList(50)
    expect(limitMock).toHaveBeenCalledWith(50)
  })
})
