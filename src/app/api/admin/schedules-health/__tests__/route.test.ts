import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/cron/scheduleHealth', () => ({
  getScheduleHealth: vi.fn(),
}))

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { getScheduleHealth } from '@/infrastructure/cron/scheduleHealth'
import { GET } from '../route'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/admin/schedules-health', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns the schedule health when authenticated', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(true)
    vi.mocked(getScheduleHealth).mockResolvedValue({ scheduled: [], missing: ['/api/cron/news'], unexpected: [] })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.missing).toEqual(['/api/cron/news'])
  })

  it('returns 500 when QStash lookup fails', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(true)
    vi.mocked(getScheduleHealth).mockRejectedValue(new Error('QStash down'))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('QStash down')
  })
})
