import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({ setConfig: vi.fn() }))
vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))
vi.mock('@/infrastructure/cron/auth', () => ({
  checkCronAuth: vi.fn().mockReturnValue(true),
  cronUnauthorized: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))

import { setConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { logCron } from '@/infrastructure/supabase/logCron'
import { checkCronAuth } from '@/infrastructure/cron/auth'
import { GET } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkCronAuth).mockReturnValue(true)
  process.env.TEST_SECRET = 'test-secret'
})

const laLigaHtml = (statsJson: string) =>
  `<html><script id="__NEXT_DATA__" type="application/json">${statsJson}</script></html>`

const mockStats = {
  'stat.total_goals_ranking': [
    {
      opta_player_id: 'p1',
      stats: [{ name: 'total_goals', stat: 10 }],
      extra_info: { name: 'Jugador Test', slug: 'jugador-test', shirtNumber: 9 },
    },
  ],
}

function mockLaLigaFetch(ok: boolean, data?: unknown) {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    ok
      ? new Response(laLigaHtml(JSON.stringify({ props: { pageProps: { leadersStats: data ?? mockStats } } })), { status: 200 })
      : new Response('', { status: 503 })
  )
}

describe('cron/stats GET', () => {
  it('returns 401 without cron auth', async () => {
    vi.mocked(checkCronAuth).mockReturnValue(false)
    const res = await GET(new Request('http://localhost/api/cron/stats'))
    expect(res.status).toBe(401)
  })

  it('scrapes LaLiga and stores leaders', async () => {
    mockLaLigaFetch(true)
    vi.mocked(setConfig).mockResolvedValue(undefined)
    vi.mocked(logCron).mockResolvedValue(undefined)

    const res = await GET(new Request('http://localhost/api/cron/stats'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.categories).toBeGreaterThan(0)
    expect(setConfig).toHaveBeenCalledWith('ceuta_leaders', expect.any(String))
  })

  it('returns 500 when LaLiga responds with non-200', async () => {
    mockLaLigaFetch(false)
    vi.mocked(logCron).mockResolvedValue(undefined)

    const res = await GET(new Request('http://localhost/api/cron/stats'))
    expect(res.status).toBe(500)
    expect(logCron).toHaveBeenCalledWith('stats', 'error', expect.any(Number), expect.any(Object))
  })

  it('returns 500 when __NEXT_DATA__ not found', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('<html>no script</html>', { status: 200 }))
    vi.mocked(logCron).mockResolvedValue(undefined)

    const res = await GET(new Request('http://localhost/api/cron/stats'))
    expect(res.status).toBe(500)
  })

  it('bypasses production check with TEST_SECRET', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    mockLaLigaFetch(true)
    vi.mocked(setConfig).mockResolvedValue(undefined)
    vi.mocked(logCron).mockResolvedValue(undefined)

    const res = await GET(new Request('http://localhost/api/cron/stats?secret=test-secret'))
    expect(res.status).toBe(200)
    vi.unstubAllEnvs()
  })
})
