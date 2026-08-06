import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/scrapers/adceutaScraper', () => ({
  scrapeAllScheduled: vi.fn(),
}))
vi.mock('@/infrastructure/supabase/client', () => ({
  supabase: { from: vi.fn() },
}))
vi.mock('@/lib/constants', () => ({
  CURRENT_MATCH_SEASON: '2026-27',
  COMPETITION: 'Primera Federación',
}))

import { scrapeAllScheduled } from '@/infrastructure/scrapers/adceutaScraper'
import { supabase } from '@/infrastructure/supabase/client'
import { GET } from '../route'

const MATCH = {
  date: '2026-09-15',
  time: '20:00',
  homeTeam: 'AD Ceuta FC',
  awayTeam: 'Burgos CF',
  weekday: 'lunes',
  isHome: true,
  ticketsUrl: null,
  espnEventId: 'esp-123',
}

function makeReq(secret?: string) {
  const url = `http://localhost/api/matches/seed${secret ? `?secret=${secret}` : ''}`
  return new Request(url)
}

function mockSupabaseChain(insertError: unknown = null) {
  vi.mocked(supabase.from).mockReturnValue({
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ error: insertError }),
  } as never)
}

beforeEach(() => {
  vi.resetAllMocks()
  process.env.TEST_SECRET = 'test-secret'
  mockSupabaseChain()
})

describe('GET /api/matches/seed', () => {
  it('returns 401 without secret', async () => {
    const res = await GET(makeReq() as never)
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong secret', async () => {
    const res = await GET(makeReq('wrong') as never)
    expect(res.status).toBe(401)
  })

  it('returns error when scraper finds no matches', async () => {
    vi.mocked(scrapeAllScheduled).mockResolvedValue([])
    const res = await GET(makeReq('test-secret') as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toMatch(/No matches/)
  })

  it('inserts scraped matches and returns count', async () => {
    vi.mocked(scrapeAllScheduled).mockResolvedValue([MATCH])
    const res = await GET(makeReq('test-secret') as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.inserted).toBe(1)
    expect(body.season).toBe('2026-27')
  })

  it('returns 500 on insert error', async () => {
    vi.mocked(scrapeAllScheduled).mockResolvedValue([MATCH])
    mockSupabaseChain({ message: 'DB insert failed' })
    const res = await GET(makeReq('test-secret') as never)
    expect(res.status).toBe(500)
  })

  it('builds external_id from date and team names', async () => {
    vi.mocked(scrapeAllScheduled).mockResolvedValue([MATCH])
    await GET(makeReq('test-secret') as never)
    const insertCall = vi.mocked(supabase.from).mock.results
      .map(r => r.value)
      .find(v => v.insert)
    expect(insertCall?.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          external_id: '2026-09-15-ad-ceuta-fc-burgos-cf',
        }),
      ])
    )
  })
})
