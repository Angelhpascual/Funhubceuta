import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({
  getConfig: vi.fn(),
  setConfig: vi.fn(),
  deleteConfig: vi.fn(),
}))
vi.mock('@/infrastructure/supabase/adminClient', () => ({
  supabaseAdmin: { from: vi.fn() },
}))
const mockSchedulesCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ scheduleId: 'sch_test123' }))
const mockSchedulesDelete = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockPublishJSON = vi.hoisted(() => vi.fn().mockResolvedValue({ messageId: 'msg_1' }))

vi.mock('@upstash/qstash', () => {
  function Client(this: { schedules: unknown; publishJSON: unknown }) {
    this.schedules = { create: mockSchedulesCreate, delete: mockSchedulesDelete }
    this.publishJSON = mockPublishJSON
  }
  return { Client }
})

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { getConfig, setConfig, deleteConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { GET, PATCH, POST, DELETE } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  mockSchedulesCreate.mockResolvedValue({ scheduleId: 'sch_test123' })
  mockSchedulesDelete.mockResolvedValue(undefined)
  mockPublishJSON.mockResolvedValue({ messageId: 'msg_1' })
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
  vi.mocked(setConfig).mockResolvedValue(undefined)
  vi.mocked(deleteConfig).mockResolvedValue(undefined)
  process.env.VERCEL_ENV = 'preview'
})

function makeReq(method: string, body?: unknown) {
  return new Request('http://localhost/api/admin/live-control', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

// ── GET ──────────────────────────────────────────────────────────────────────

describe('GET /api/admin/live-control', () => {
  it('returns 401 without auth (regression: GET had no auth check at all while every other verb on this route did, leaking QStash schedule IDs and the last match result to anyone)', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns active=true when config is "true"', async () => {
    vi.mocked(getConfig).mockImplementation(async (key: string) => {
      if (key === 'live_active') return 'true'
      if (key === 'live_qstash_schedule_id') return 'sch_abc'
      return null
    })
    const res = await GET()
    const body = await res.json()
    expect(body.active).toBe(true)
    expect(body.scheduleId).toBe('sch_abc')
    expect(body.lastResult).toBeNull()
  })

  it('returns active=false when config is not "true"', async () => {
    vi.mocked(getConfig).mockResolvedValue(null)
    const res = await GET()
    const body = await res.json()
    expect(body.active).toBe(false)
  })

  it('parses lastResult when recent (< 3 days)', async () => {
    const savedAt = new Date().toISOString()
    const lastResult = JSON.stringify({ homeTeam: 'AD Ceuta', awayTeam: 'Rival', homeScore: 1, awayScore: 0, savedAt })
    vi.mocked(getConfig).mockImplementation(async (key: string) => {
      if (key === 'live_last_result') return lastResult
      return null
    })
    const res = await GET()
    const body = await res.json()
    expect(body.lastResult).not.toBeNull()
    expect(body.lastResult.homeScore).toBe(1)
  })

  it('ignores lastResult older than 3 days', async () => {
    const old = new Date(Date.now() - 4 * 86_400_000).toISOString()
    const stale = JSON.stringify({ homeTeam: 'A', awayTeam: 'B', homeScore: 0, awayScore: 0, savedAt: old })
    vi.mocked(getConfig).mockImplementation(async (key: string) => {
      if (key === 'live_last_result') return stale
      return null
    })
    const res = await GET()
    const body = await res.json()
    expect(body.lastResult).toBeNull()
  })
})

// ── PATCH ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/admin/live-control', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await PATCH(makeReq('PATCH', { action: 'activate_result' }))
    expect(res.status).toBe(401)
  })

  it('activate_result: saves mock as last result', async () => {
    const mock = { homeTeam: 'AD Ceuta', awayTeam: 'Rival', homeScore: 2, awayScore: 1, state: 'live' }
    vi.mocked(getConfig).mockImplementation(async (key: string) => {
      if (key === 'live_match_mock') return JSON.stringify(mock)
      return null
    })
    const res = await PATCH(makeReq('PATCH', { action: 'activate_result' }))
    expect(res.status).toBe(200)
    expect(setConfig).toHaveBeenCalledWith('live_last_result', expect.stringContaining('"state":"post"'))
  })

  it('activate_result: returns 400 when no mock available', async () => {
    vi.mocked(getConfig).mockResolvedValue(null)
    const res = await PATCH(makeReq('PATCH', { action: 'activate_result' }))
    expect(res.status).toBe(400)
  })

  it('default action: clears live_last_result', async () => {
    const res = await PATCH(makeReq('PATCH', {}))
    expect(res.status).toBe(200)
    expect(deleteConfig).toHaveBeenCalledWith('live_last_result')
  })
})

// ── POST ──────────────────────────────────────────────────────────────────────

describe('POST /api/admin/live-control', () => {
  beforeEach(() => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null })
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ single: maybeSingle }) }),
        }),
      }),
    } as never)
  })

  it('returns 401 without auth', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await POST()
    expect(res.status).toBe(401)
  })

  it('non-production: sets live_active and returns null scheduleId', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.scheduleId).toBeNull()
    expect(setConfig).toHaveBeenCalledWith('live_active', 'true')
  })

  it('production: queues the first live tick as a QStash message, not a schedule (regression: maxSchedules quota blocked live mode)', async () => {
    process.env.VERCEL_ENV = 'production'
    vi.mocked(getConfig).mockResolvedValue(null)
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.scheduleId).toBeNull()
    expect(mockSchedulesCreate).not.toHaveBeenCalled()
    expect(mockPublishJSON).toHaveBeenCalledWith(expect.objectContaining({ delay: 0 }))
    expect(setConfig).toHaveBeenCalledWith('live_active', 'true')
    expect(setConfig).toHaveBeenCalledWith('live_activated_at', expect.any(String))
  })

  it('production: does not queue a second tick if live is already active', async () => {
    process.env.VERCEL_ENV = 'production'
    vi.mocked(getConfig).mockImplementation(async (key: string) => (key === 'live_active' ? 'true' : null))
    const res = await POST()
    const body = await res.json()
    expect(body.already).toBe(true)
    expect(mockPublishJSON).not.toHaveBeenCalled()
  })

  it('production: reverts live_active if the first tick cannot be queued', async () => {
    process.env.VERCEL_ENV = 'production'
    vi.mocked(getConfig).mockResolvedValue(null)
    mockPublishJSON.mockRejectedValue(new Error('qstash down'))
    await expect(POST()).rejects.toThrow('qstash down')
    expect(setConfig).toHaveBeenLastCalledWith('live_active', 'false')
  })
})

// ── DELETE ────────────────────────────────────────────────────────────────────

describe('DELETE /api/admin/live-control', () => {
  it('returns 401 without auth', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await DELETE()
    expect(res.status).toBe(401)
  })

  it('non-production: clears flags without QStash', async () => {
    const res = await DELETE()
    expect(res.status).toBe(200)
    expect(setConfig).toHaveBeenCalledWith('live_active', 'false')
    expect(deleteConfig).toHaveBeenCalledWith('live_match_state')
    expect(deleteConfig).toHaveBeenCalledWith('live_match_mock')
  })

  it('production: deletes QStash schedule and clears flags', async () => {
    process.env.VERCEL_ENV = 'production'
    vi.mocked(getConfig).mockResolvedValue('sch_to_delete')
    const res = await DELETE()
    expect(res.status).toBe(200)
    expect(deleteConfig).toHaveBeenCalledWith('live_qstash_schedule_id')
    expect(setConfig).toHaveBeenCalledWith('live_active', 'false')
  })

  it('production: continues cleanup even if QStash delete fails', async () => {
    process.env.VERCEL_ENV = 'production'
    vi.mocked(getConfig).mockResolvedValue('sch_gone')
    mockSchedulesDelete.mockRejectedValueOnce(new Error('Not found'))
    const res = await DELETE()
    expect(res.status).toBe(200)
    expect(setConfig).toHaveBeenCalledWith('live_active', 'false')
  })
})
