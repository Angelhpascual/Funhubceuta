import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/supabase/AdminStatsRepository', () => ({
  getRecentCronLogs: vi.fn(),
}))

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { getRecentCronLogs } from '@/infrastructure/supabase/AdminStatsRepository'
import { GET } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
})

describe('GET /api/admin/activity', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns logs array', async () => {
    const logs = [
      { id: '1', created_at: '2026-05-01T10:00:00Z', cron_type: 'news', status: 'success', duration_ms: 1200, details: {} },
    ]
    vi.mocked(getRecentCronLogs).mockResolvedValue(logs)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.logs).toHaveLength(1)
    expect(body.logs[0].cron_type).toBe('news')
  })

  it('returns empty array when no logs', async () => {
    vi.mocked(getRecentCronLogs).mockResolvedValue([])
    const res = await GET()
    const body = await res.json()
    expect(body.logs).toEqual([])
  })

  it('calls getRecentCronLogs with limit 30', async () => {
    vi.mocked(getRecentCronLogs).mockResolvedValue([])
    await GET()
    expect(getRecentCronLogs).toHaveBeenCalledWith(30)
  })
})
