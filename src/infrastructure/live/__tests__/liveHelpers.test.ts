import { describe, it, expect, vi, beforeEach } from 'vitest'

const { publishJSON, scheduleDelete } = vi.hoisted(() => ({ publishJSON: vi.fn(), scheduleDelete: vi.fn() }))
vi.mock('@upstash/qstash', () => ({
  Client: function (this: Record<string, unknown>) {
    this.publishJSON = publishJSON
    this.schedules = { delete: scheduleDelete }
  },
}))
vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({
  getConfig: vi.fn(),
  setConfig: vi.fn(),
  deleteConfig: vi.fn(),
}))
vi.mock('@/lib/appEnv', () => ({ getAppEnv: vi.fn() }))

import { getConfig, setConfig, deleteConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { getAppEnv } from '@/lib/appEnv'
import { enqueueLiveTick } from '../enqueueLiveTick'
import { stopLiveSchedule } from '../stopLiveSchedule'
import { liveUrl } from '../liveUrl'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getAppEnv).mockReturnValue('production')
})

describe('enqueueLiveTick', () => {
  it('is a no-op outside production', async () => {
    vi.mocked(getAppEnv).mockReturnValue('development')
    expect(await enqueueLiveTick(60)).toEqual({ enqueued: false })
    expect(publishJSON).not.toHaveBeenCalled()
  })

  it('starts a new chain: stores a fresh chain id and publishes it', async () => {
    await enqueueLiveTick(0)
    const chainCall = vi.mocked(setConfig).mock.calls.find((c) => c[0] === 'live_chain_id')!
    expect(publishJSON).toHaveBeenCalledWith(expect.objectContaining({ delay: 0, body: { chain: chainCall[1] } }))
  })

  it('continues an existing chain without replacing its id', async () => {
    await enqueueLiveTick(60, 'abc')
    expect(setConfig).not.toHaveBeenCalledWith('live_chain_id', expect.anything())
    expect(publishJSON).toHaveBeenCalledWith(expect.objectContaining({ body: { chain: 'abc' } }))
  })

  it('stamps live_last_tick before publishing', async () => {
    const order: string[] = []
    vi.mocked(setConfig).mockImplementation(async (k: string) => { order.push(`set:${k}`) })
    publishJSON.mockImplementation(async () => { order.push('publish') })
    await enqueueLiveTick(60, 'abc')
    expect(order).toEqual(['set:live_last_tick', 'publish'])
  })
})

describe('stopLiveSchedule', () => {
  it('clears every live flag including the chain id', async () => {
    await stopLiveSchedule()
    expect(setConfig).toHaveBeenCalledWith('live_active', 'false')
    for (const k of ['live_activated_at', 'live_last_tick', 'live_chain_id']) {
      expect(deleteConfig).toHaveBeenCalledWith(k)
    }
  })

  it('deletes a legacy schedule and survives its deletion failing', async () => {
    vi.mocked(getConfig).mockResolvedValue('sched-1')
    scheduleDelete.mockRejectedValue(new Error('gone'))
    await stopLiveSchedule()
    expect(scheduleDelete).toHaveBeenCalledWith('sched-1')
    expect(deleteConfig).toHaveBeenCalledWith('live_qstash_schedule_id')
    expect(setConfig).toHaveBeenCalledWith('live_active', 'false')
  })
})

describe('liveUrl', () => {
  it('points at /api/cron/live', () => {
    expect(liveUrl()).toMatch(/\/api\/cron\/live$/)
  })
})
