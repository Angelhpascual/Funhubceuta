import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../adminClient', () => {
  const insert = vi.fn()
  const then = vi.fn((ok: () => unknown) => { ok(); return Promise.resolve() })
  const from = vi.fn(() => ({ insert: vi.fn(() => ({ then })), __insert: insert, __then: then }))
  return { supabaseAdmin: { from, __from: from } }
})

import { supabaseAdmin } from '../adminClient'
import { logCron, logNotification } from '../logCron'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom: ReturnType<typeof vi.fn> = (supabaseAdmin as any).__from

beforeEach(() => { vi.resetAllMocks() })

describe('logCron', () => {
  it('inserts into cron_logs without throwing', async () => {
    const insert = vi.fn(() => ({ then: vi.fn((ok: () => unknown) => { ok(); return Promise.resolve() }) }))
    mockFrom.mockReturnValue({ insert })
    await expect(logCron('news', 'success', 1200, { updated: 5 })).resolves.not.toThrow()
    expect(mockFrom).toHaveBeenCalledWith('cron_logs')
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      cron_type: 'news',
      status: 'success',
      duration_ms: 1200,
    }))
  })

  it('swallows DB errors silently', async () => {
    const insert = vi.fn(() => ({ then: vi.fn((_ok: unknown, err: (e: Error) => unknown) => { err(new Error('DB fail')); return Promise.resolve() }) }))
    mockFrom.mockReturnValue({ insert })
    await expect(logCron('matches', 'error', 500, { error: 'timeout' })).resolves.not.toThrow()
  })
})

describe('logNotification', () => {
  it('inserts into notification_logs', async () => {
    const insert = vi.fn(() => ({ then: vi.fn((ok: () => unknown) => { ok(); return Promise.resolve() }) }))
    mockFrom.mockReturnValue({ insert })
    await expect(logNotification({
      articleTitle: 'Ceuta gana', articleSource: 'faro', articleUrl: 'https://faro.es/1',
      recipients: 10, sentOk: 9, sentFail: 1,
    })).resolves.not.toThrow()
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      article_title: 'Ceuta gana',
      recipients: 10,
      sent_ok: 9,
      sent_fail: 1,
    }))
  })
})
