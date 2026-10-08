import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/infrastructure/scrapers/squadScraper', () => ({ scrapeSquad: vi.fn() }))
vi.mock('@/infrastructure/supabase/SquadSupabaseRepository', () => ({ upsertSquad: vi.fn() }))
vi.mock('@/infrastructure/squad/backfillSquadPhotos', () => ({ backfillSquadPhotos: vi.fn() }))
vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))
vi.mock('@/lib/constants', () => ({ CURRENT_SEASON: '2025-2026' }))
vi.mock('@/infrastructure/cron/auth', () => ({
  verifyCronRequest: vi.fn().mockResolvedValue(true),
  cronUnauthorized: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))

import { scrapeSquad } from '@/infrastructure/scrapers/squadScraper'
import { upsertSquad } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { backfillSquadPhotos } from '@/infrastructure/squad/backfillSquadPhotos'
import { logCron } from '@/infrastructure/supabase/logCron'
import { verifyCronRequest } from '@/infrastructure/cron/auth'
import { GET, POST } from '../route'

const player = { dorsal: 9, name: 'Test', position: 'Delantero', positionGroup: 'Delanteros', nationality: 'ESP', height: null, weight: null, birthDate: null, photoUrl: null }

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(verifyCronRequest).mockResolvedValue(true)
  vi.mocked(backfillSquadPhotos).mockResolvedValue({ pending: 0, optimized: 0, failed: 0 })
})

describe('cron/squad GET', () => {
  it('returns 405 in production without secret', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = await GET(new NextRequest('http://localhost/api/cron/squad'))
    expect(res.status).toBe(405)
    vi.unstubAllEnvs()
  })

  it('returns count when players found', async () => {
    vi.mocked(scrapeSquad).mockResolvedValue([player])
    vi.mocked(upsertSquad).mockResolvedValue(undefined)
    vi.mocked(logCron).mockResolvedValue(undefined)
    const res = await GET(new NextRequest('http://localhost/api/cron/squad'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.count).toBe(1)
    expect(backfillSquadPhotos).toHaveBeenCalled()
  })

  it('logs the backfill as an error when some photos fail, even though the squad sync itself succeeded (regression: this used to always log "success" and drop the failed count entirely)', async () => {
    vi.mocked(scrapeSquad).mockResolvedValue([player])
    vi.mocked(upsertSquad).mockResolvedValue(undefined)
    vi.mocked(backfillSquadPhotos).mockResolvedValue({ pending: 3, optimized: 1, failed: 2 })
    vi.mocked(logCron).mockResolvedValue(undefined)

    const res = await GET(new NextRequest('http://localhost/api/cron/squad'))

    expect(res.status).toBe(200)
    expect(logCron).toHaveBeenCalledWith('squad', 'error', expect.any(Number), {
      players: 1, photosBackfilled: 1, photosFailed: 2,
    })
  })

  it('logs success with 0 when scraper returns empty', async () => {
    vi.mocked(scrapeSquad).mockResolvedValue([])
    vi.mocked(logCron).mockResolvedValue(undefined)
    const res = await GET(new NextRequest('http://localhost/api/cron/squad'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.count).toBe(0)
    expect(logCron).toHaveBeenCalledWith('squad', 'success', expect.any(Number), { players: 0 })
  })

  it('logs error and rethrows when upsert fails', async () => {
    vi.mocked(scrapeSquad).mockResolvedValue([player])
    vi.mocked(upsertSquad).mockRejectedValue(new Error('DB error'))
    vi.mocked(logCron).mockResolvedValue(undefined)
    await expect(GET(new NextRequest('http://localhost/api/cron/squad'))).rejects.toThrow('DB error')
    expect(logCron).toHaveBeenCalledWith('squad', 'error', expect.any(Number), { error: 'DB error' })
  })
})

describe('cron/squad POST', () => {
  it('syncs squad and returns count', async () => {
    vi.mocked(scrapeSquad).mockResolvedValue([player, player])
    vi.mocked(upsertSquad).mockResolvedValue(undefined)
    vi.mocked(logCron).mockResolvedValue(undefined)
    const res = await POST(new NextRequest('http://localhost', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.count).toBe(2)
  })

  it('rejects an unverified request (regression: POST had no auth check at all before this fix)', async () => {
    vi.mocked(verifyCronRequest).mockResolvedValue(false)
    const res = await POST(new NextRequest('http://localhost', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(401)
    expect(scrapeSquad).not.toHaveBeenCalled()
  })
})
