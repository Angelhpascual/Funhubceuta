import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => {
  const from = vi.fn()
  return { supabase: { from, __from: from } }
})

import { supabase } from '../client'
import { getRecentCronLogs } from '../AdminStatsRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom: ReturnType<typeof vi.fn> = (supabase as any).__from

beforeEach(() => { vi.resetAllMocks() })

const logRow = { id: '1', created_at: '2026-01-01T00:00:00Z', cron_type: 'news', status: 'success', duration_ms: 1200, details: { updated: 5 } }

describe('getRecentCronLogs', () => {
  it('returns cron log rows', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [logRow] }),
    }
    mockFrom.mockReturnValue(chain)
    const result = await getRecentCronLogs(30)
    expect(result).toHaveLength(1)
    expect(result[0].cron_type).toBe('news')
    expect(chain.limit).toHaveBeenCalledWith(30)
  })

  it('returns empty array when no logs', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null }),
    }
    mockFrom.mockReturnValue(chain)
    expect(await getRecentCronLogs()).toEqual([])
  })

  it('orders by created_at descending', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
    }
    mockFrom.mockReturnValue(chain)
    await getRecentCronLogs()
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })
})
