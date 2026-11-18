import { describe, it, expect, vi } from 'vitest'

const mockList = vi.hoisted(() => vi.fn())

vi.mock('@upstash/qstash', () => {
  function Client(this: { schedules: unknown }) {
    this.schedules = { list: mockList }
  }
  return { Client }
})

import { getScheduleHealth, EXPECTED_CRON_PATHS } from '../scheduleHealth'

function schedule(path: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    scheduleId: `sch_${path}`,
    cron: '0 * * * *',
    createdAt: 0,
    destination: `https://adceutainfo.vercel.app${path}`,
    method: 'POST',
    retries: 3,
    isPaused: false,
    ...overrides,
  }
}

describe('getScheduleHealth', () => {
  it('reports no missing/unexpected when every expected path has a schedule', async () => {
    mockList.mockResolvedValue(EXPECTED_CRON_PATHS.map((p) => schedule(p)))

    const health = await getScheduleHealth()

    expect(health.missing).toEqual([])
    expect(health.unexpected).toEqual([])
    expect(health.scheduled).toHaveLength(EXPECTED_CRON_PATHS.length)
  })

  it('flags an expected cron with no active schedule as missing', async () => {
    const withoutOne = EXPECTED_CRON_PATHS.slice(1)
    mockList.mockResolvedValue(withoutOne.map((p) => schedule(p)))

    const health = await getScheduleHealth()

    expect(health.missing).toEqual([EXPECTED_CRON_PATHS[0]])
  })

  it('flags a schedule pointing at an unknown path as unexpected', async () => {
    mockList.mockResolvedValue([
      ...EXPECTED_CRON_PATHS.map((p) => schedule(p)),
      schedule('/api/cron/old-removed-route'),
    ])

    const health = await getScheduleHealth()

    expect(health.missing).toEqual([])
    expect(health.unexpected).toHaveLength(1)
    expect(health.unexpected[0].path).toBe('/api/cron/old-removed-route')
  })
})
