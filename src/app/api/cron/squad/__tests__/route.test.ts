import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/scrapers/squadScraper', () => ({ scrapeSquad: vi.fn() }))
vi.mock('@/infrastructure/supabase/SquadSupabaseRepository', () => ({ upsertSquad: vi.fn() }))
vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))
vi.mock('@/lib/constants', () => ({ CURRENT_SEASON: '2025-2026' }))

import { scrapeSquad } from '@/infrastructure/scrapers/squadScraper'
import { upsertSquad } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { logCron } from '@/infrastructure/supabase/logCron'
import { GET, POST } from '../route'

const player = { dorsal: 9, name: 'Test', position: 'Delantero', positionGroup: 'Delanteros', nationality: 'ESP', height: null, weight: null, birthDate: null, photoUrl: null }

beforeEach(() => { vi.resetAllMocks() })

describe('cron/squad GET', () => {
  it('returns 405 in production without secret', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = await GET(new Request('http://localhost/api/cron/squad'))
    expect(res.status).toBe(405)
    vi.unstubAllEnvs()
  })

  it('returns count when players found', async () => {
    vi.mocked(scrapeSquad).mockResolvedValue([player])
    vi.mocked(upsertSquad).mockResolvedValue(undefined)
    vi.mocked(logCron).mockResolvedValue(undefined)
    const res = await GET(new Request('http://localhost/api/cron/squad'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.count).toBe(1)
  })

  it('logs success with 0 when scraper returns empty', async () => {
    vi.mocked(scrapeSquad).mockResolvedValue([])
    vi.mocked(logCron).mockResolvedValue(undefined)
    const res = await GET(new Request('http://localhost/api/cron/squad'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.count).toBe(0)
    expect(logCron).toHaveBeenCalledWith('squad', 'success', expect.any(Number), { players: 0 })
  })

  it('logs error and rethrows when upsert fails', async () => {
    vi.mocked(scrapeSquad).mockResolvedValue([player])
    vi.mocked(upsertSquad).mockRejectedValue(new Error('DB error'))
    vi.mocked(logCron).mockResolvedValue(undefined)
    await expect(GET(new Request('http://localhost/api/cron/squad'))).rejects.toThrow('DB error')
    expect(logCron).toHaveBeenCalledWith('squad', 'error', expect.any(Number), { error: 'DB error' })
  })
})

describe('cron/squad POST', () => {
  it('syncs squad and returns count', async () => {
    vi.mocked(scrapeSquad).mockResolvedValue([player, player])
    vi.mocked(upsertSquad).mockResolvedValue(undefined)
    vi.mocked(logCron).mockResolvedValue(undefined)
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.count).toBe(2)
  })
})
