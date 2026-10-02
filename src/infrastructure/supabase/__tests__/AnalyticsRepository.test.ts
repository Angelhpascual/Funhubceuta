import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../adminClient', () => {
  const from = vi.fn()
  const rpc = vi.fn()
  return { supabaseAdmin: { from, rpc, __from: from, __rpc: rpc } }
})

import { supabaseAdmin } from '../adminClient'
import { getAnalyticsData } from '../AnalyticsRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom: ReturnType<typeof vi.fn> = (supabaseAdmin as any).__from
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRpc: ReturnType<typeof vi.fn> = (supabaseAdmin as any).__rpc

beforeEach(() => { vi.resetAllMocks() })

// Each count query is `.from(table).select('*', {count:'exact', head:true})`
function mockCountQuery(counts: Record<string, number>) {
  mockFrom.mockImplementation((table: string) => ({
    select: vi.fn().mockResolvedValue({ count: counts[table] ?? 0 }),
  }))
}

function mockCronLogsFallback(rows: { created_at: string; details: unknown }[]) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'cron_logs') {
      return {
        select: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: rows }),
          }),
        }),
      }
    }
    return { select: vi.fn().mockResolvedValue({ count: 0 }) }
  })
}

describe('getAnalyticsData', () => {
  it('returns counts from each table', async () => {
    mockCountQuery({ push_subscriptions: 8, mvp_votes: 42, prediction_votes: 3, news: 1719 })
    mockRpc.mockResolvedValue({ data: [{ month: '2026-09', subs: 8 }] })

    const result = await getAnalyticsData()
    expect(result.pushSubscribers).toBe(8)
    expect(result.mvpVotes).toBe(42)
    expect(result.predictions).toBe(3)
    expect(result.totalNews).toBe(1719)
  })

  it('defaults missing counts to 0', async () => {
    mockFrom.mockReturnValue({ select: vi.fn().mockResolvedValue({ count: null }) })
    mockRpc.mockResolvedValue({ data: [] })

    const result = await getAnalyticsData()
    expect(result.pushSubscribers).toBe(0)
    expect(result.mvpVotes).toBe(0)
    expect(result.predictions).toBe(0)
    expect(result.totalNews).toBe(0)
  })

  it('uses the growth data from the RPC when it succeeds', async () => {
    mockCountQuery({})
    mockRpc.mockResolvedValue({ data: [{ month: '2026-08', subs: 5 }, { month: '2026-09', subs: 8 }] })

    const result = await getAnalyticsData()
    expect(result.growth).toEqual([{ month: '2026-08', subs: 5 }, { month: '2026-09', subs: 8 }])
  })

  it('falls back to deriving growth from cron_logs when the RPC fails (regression: subscribers_by_month may not exist as a function)', async () => {
    mockRpc.mockRejectedValue(new Error('function does not exist'))
    mockCronLogsFallback([
      { created_at: '2026-08-05T10:00:00Z', details: { subscribers: 3 } },
      { created_at: '2026-08-20T10:00:00Z', details: { subscribers: 5 } },
      { created_at: '2026-09-01T10:00:00Z', details: { subscribers: 8 } },
    ])

    const result = await getAnalyticsData()
    // Keeps the highest value seen within each month
    expect(result.growth).toEqual([
      { month: '2026-08', subs: 5 },
      { month: '2026-09', subs: 8 },
    ])
  })

  it('falls back to deriving growth from cron_logs when the RPC returns no data', async () => {
    mockRpc.mockResolvedValue({ data: null })
    mockCronLogsFallback([{ created_at: '2026-09-01T10:00:00Z', details: { subscribers: 1 } }])

    const result = await getAnalyticsData()
    expect(result.growth).toEqual([{ month: '2026-09', subs: 1 }])
  })

  it('returns empty growth when both the RPC and the cron_logs fallback have nothing', async () => {
    mockRpc.mockResolvedValue({ data: null })
    mockCronLogsFallback([])

    const result = await getAnalyticsData()
    expect(result.growth).toEqual([])
  })
})
