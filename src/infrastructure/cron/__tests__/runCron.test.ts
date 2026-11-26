import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({ getConfig: vi.fn(), setConfig: vi.fn() }))
vi.mock('@/infrastructure/push/notifyAdmin', () => ({ notifyAdmin: vi.fn() }))
vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn() }))

import { getConfig, setConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { notifyAdmin } from '@/infrastructure/push/notifyAdmin'
import { logCron } from '@/infrastructure/supabase/logCron'
import { runCron, alertCronProblem } from '../runCron'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getConfig).mockResolvedValue(null)
})

describe('runCron', () => {
  it('returns the result untouched and stays quiet on success', async () => {
    expect(await runCron('x', async () => 5)).toBe(5)
    expect(notifyAdmin).not.toHaveBeenCalled()
    expect(logCron).not.toHaveBeenCalled()
  })

  it('logs, alerts and rethrows when the body throws', async () => {
    await expect(runCron('x', async () => { throw new Error('boom') })).rejects.toThrow('boom')
    expect(logCron).toHaveBeenCalledWith('x', 'error', expect.any(Number), { error: 'Error: boom' })
    expect(notifyAdmin).toHaveBeenCalledWith('⚠️ Cron x falla', expect.stringContaining('boom'))
  })

  it('alerts when a successful run is empty', async () => {
    await runCron('x', async () => 0, { isEmpty: (n) => n === 0 })
    expect(notifyAdmin).toHaveBeenCalledWith('⚠️ Cron x sin resultados', expect.any(String))
  })

  it('does not alert for a non-empty result', async () => {
    await runCron('x', async () => 3, { isEmpty: (n) => n === 0 })
    expect(notifyAdmin).not.toHaveBeenCalled()
  })
})

describe('alertCronProblem', () => {
  it('sends at most one alert per kind every 12 hours', async () => {
    vi.mocked(getConfig).mockResolvedValue(new Date(Date.now() - 3_600_000).toISOString())
    await alertCronProblem('x', 'error', 'again')
    expect(notifyAdmin).not.toHaveBeenCalled()
    vi.mocked(getConfig).mockResolvedValue(new Date(Date.now() - 13 * 3_600_000).toISOString())
    await alertCronProblem('x', 'error', 'again')
    expect(notifyAdmin).toHaveBeenCalledTimes(1)
    expect(setConfig).toHaveBeenCalledWith('cron_alert:x:error', expect.any(String))
  })

  it('never throws even if alerting itself fails', async () => {
    vi.mocked(getConfig).mockRejectedValue(new Error('db down'))
    await expect(alertCronProblem('x', 'error', 'd')).resolves.toBeUndefined()
  })
})
