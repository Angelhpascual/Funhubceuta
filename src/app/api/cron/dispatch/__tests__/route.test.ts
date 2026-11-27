import { describe, it, expect, vi, beforeEach } from 'vitest'

const { publishJSON } = vi.hoisted(() => ({ publishJSON: vi.fn() }))
vi.mock('@upstash/qstash', () => ({
  Client: function (this: Record<string, unknown>) { this.publishJSON = publishJSON },
}))
vi.mock('@/infrastructure/cron/auth', () => ({
  verifyCronRequest: vi.fn(),
  cronUnauthorized: () => new Response('{}', { status: 401 }),
}))
vi.mock('@/infrastructure/cron/runCron', () => ({ alertCronProblem: vi.fn() }))
vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))
vi.mock('@/lib/appEnv', () => ({ getAppEnv: vi.fn() }))

import { verifyCronRequest } from '@/infrastructure/cron/auth'
import { alertCronProblem } from '@/infrastructure/cron/runCron'
import { getAppEnv } from '@/lib/appEnv'
import { DISPATCH_GROUPS } from '@/infrastructure/cron/dispatchGroups'
import { POST } from '../route'

const req = (group?: string) =>
  new Request(`http://localhost/api/cron/dispatch${group ? `?group=${group}` : ''}`, { method: 'POST' })

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(verifyCronRequest).mockResolvedValue(true)
  vi.mocked(getAppEnv).mockReturnValue('production')
  process.env.NEXT_PUBLIC_BASE_URL = 'https://x.test'
  publishJSON.mockResolvedValue({ messageId: 'm' })
})

describe('POST /api/cron/dispatch', () => {
  it('rejects unauthenticated calls', async () => {
    vi.mocked(verifyCronRequest).mockResolvedValue(false)
    expect((await POST(req('daily'))).status).toBe(401)
    expect(publishJSON).not.toHaveBeenCalled()
  })

  it('rejects an unknown group', async () => {
    expect((await POST(req('hourly'))).status).toBe(400)
    expect((await POST(req())).status).toBe(400)
  })

  it('publishes one delayed message per job in the weekly group', async () => {
    const res = await POST(req('weekly'))
    expect(res.status).toBe(200)
    expect(publishJSON).toHaveBeenCalledTimes(DISPATCH_GROUPS.weekly.length)
    for (const job of DISPATCH_GROUPS.weekly) {
      expect(publishJSON).toHaveBeenCalledWith({ url: `https://x.test${job.path}`, body: {}, delay: job.delay })
    }
  })

  it('does nothing outside production', async () => {
    vi.mocked(getAppEnv).mockReturnValue('development')
    const body = await (await POST(req('daily'))).json()
    expect(body.skipped).toBe('not-production')
    expect(publishJSON).not.toHaveBeenCalled()
  })

  it('still publishes the other jobs, alerts and answers 500 when one publish fails', async () => {
    publishJSON.mockRejectedValueOnce(new Error('429')).mockResolvedValue({ messageId: 'm' })
    const res = await POST(req('weekly'))
    expect(res.status).toBe(500)
    expect(publishJSON).toHaveBeenCalledTimes(DISPATCH_GROUPS.weekly.length)
    expect(alertCronProblem).toHaveBeenCalledWith('dispatch', 'error', expect.stringContaining(DISPATCH_GROUPS.weekly[0].path))
  })
})
