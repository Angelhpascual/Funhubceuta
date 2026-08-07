import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({
  setConfig: vi.fn(),
  deleteConfig: vi.fn(),
}))
vi.mock('@/infrastructure/supabase/adminClient', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { setConfig, deleteConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { POST } from '../route'

function makeReq(body: unknown) {
  return new Request('http://localhost/api/admin/live-mock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function mockNextMatch(data: unknown = null) {
  vi.mocked(supabaseAdmin.from).mockReturnValue({
    select: vi.fn().mockReturnValue({
      gte: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data }),
          }),
        }),
      }),
    }),
  } as never)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
  vi.mocked(setConfig).mockResolvedValue(undefined)
  vi.mocked(deleteConfig).mockResolvedValue(undefined)
  mockNextMatch()
})

describe('POST /api/admin/live-mock', () => {
  it('returns 401 without admin auth', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await POST(makeReq({ scenario: 'pre' }))
    expect(res.status).toBe(401)
  })

  it('clears live mock when scenario is clear', async () => {
    const res = await POST(makeReq({ scenario: 'clear' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.cleared).toBe(true)
    expect(deleteConfig).toHaveBeenCalledWith('live_match_mock')
    expect(setConfig).not.toHaveBeenCalled()
  })

  it('returns 400 for unknown scenario', async () => {
    const res = await POST(makeReq({ scenario: 'nonexistent_scenario' }))
    expect(res.status).toBe(400)
  })

  it('sets live mock config for valid scenario', async () => {
    const res = await POST(makeReq({ scenario: 'pre' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.scenario).toBe('pre')
    expect(setConfig).toHaveBeenCalledWith('live_match_mock', expect.any(String))
  })

  it('uses real match data from DB when available', async () => {
    mockNextMatch({
      home_team: 'Burgos CF',
      away_team: 'AD Ceuta FC',
      venue: 'Estadio El Plantío',
      date: '2026-09-15',
      time: '20:00',
    })
    const res = await POST(makeReq({ scenario: 'pre' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.match.homeTeam).toBe('Burgos CF')
    expect(body.match.awayTeam).toBe('AD Ceuta FC')
  })

  it('uses fallback teams when no DB match found', async () => {
    mockNextMatch(null)
    const res = await POST(makeReq({ scenario: 'pre' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.match.homeTeam).toBe('FC Andorra')
  })

  it('handles sim_goal1 scenario', async () => {
    const res = await POST(makeReq({ scenario: 'sim_goal1' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.match.state).toBe('in')
    expect(body.match.awayScore).toBeGreaterThan(0)
  })

  it('handles sim_final scenario with post state', async () => {
    const res = await POST(makeReq({ scenario: 'sim_final' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.match.state).toBe('post')
  })
})
