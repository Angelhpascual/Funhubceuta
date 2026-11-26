import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { POST } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
  process.env.QSTASH_TOKEN = 'test-token'
  process.env.NEXT_PUBLIC_BASE_URL = 'https://test.vercel.app'
})

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/admin/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/trigger', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await POST(makeRequest({ action: 'news' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for unknown action', async () => {
    const res = await POST(makeRequest({ action: 'unknown-action' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Unknown action')
  })

  it('enqueues known actions via QStash', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 })
    )
    const res = await POST(makeRequest({ action: 'news' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.action).toBe('news')
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/cron/news'),
      expect.objectContaining({ method: 'POST' })
    )
    fetchSpy.mockRestore()
  })

  it('fails (500) instead of answering ok when QSTASH_TOKEN is missing', async () => {
    delete process.env.QSTASH_TOKEN
    const res = await POST(makeRequest({ action: 'matches' }))
    expect(res.status).toBe(500)
    expect((await res.json()).ok).toBe(false)
  })

  it('fails (500) when QStash rejects the publish, e.g. quota exceeded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('quota exceeded', { status: 429 })))
    const res = await POST(makeRequest({ action: 'matches' }))
    vi.unstubAllGlobals()
    expect(res.status).toBe(500)
    expect((await res.json()).error).toContain('429')
  })

  it('returns sent count nested under result for push action (regression: UI read body.result.sent)', async () => {
    vi.doMock('@/infrastructure/push/sendPush', () => ({
      sendPush: vi.fn().mockResolvedValue({ sent: 8, total: 8 }),
    }))
    const { POST: freshPost } = await import('../route')
    const res = await freshPost(makeRequest({
      action: 'push',
      payload: { title: 'Test', body: 'Body', tag: 'test', url: '/' },
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.action).toBe('push')
    expect(body.result.sent).toBe(8)
    expect(body.result.total).toBe(8)
    vi.doUnmock('@/infrastructure/push/sendPush')
  })

  it('sends the disallowed-goal message for the given team (regression: ESPN never reports this event)', async () => {
    const sendPush = vi.fn().mockResolvedValue({ sent: 8, total: 8 })
    vi.doMock('@/infrastructure/push/sendPush', () => ({ sendPush }))
    vi.doMock('@/app/api/cron/live/messages', () => ({
      MSG: { goalDisallowed: vi.fn((team: string) => ({ title: `title-${team}`, body: `body-${team}` })) },
    }))
    const { POST: freshPost } = await import('../route')

    const res = await freshPost(makeRequest({ action: 'goal-disallowed', payload: { team: 'rival' } }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.team).toBe('rival')
    expect(sendPush).toHaveBeenCalledWith(expect.objectContaining({ title: 'title-rival', body: 'body-rival', tag: 'goal-disallowed' }))

    vi.doUnmock('@/infrastructure/push/sendPush')
    vi.doUnmock('@/app/api/cron/live/messages')
  })

  it('creates the close-finished-matches QStash schedule once, then reports it already exists on a second call (idempotent setup)', async () => {
    const getConfig = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('scd_existing')
    const setConfig = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@/infrastructure/supabase/AppConfigRepository', () => ({ getConfig, setConfig }))
    const scheduleCreate = vi.fn().mockResolvedValue({ scheduleId: 'scd_new' })
    vi.doMock('@upstash/qstash', () => ({
      Client: class { schedules = { create: scheduleCreate, get: vi.fn().mockResolvedValue({ scheduleId: 'scd_existing' }) } },
    }))
    const { POST: freshPost } = await import('../route')

    const res1 = await freshPost(makeRequest({ action: 'setup-close-finished-matches-schedule' }))
    const body1 = await res1.json()
    expect(body1.result.created).toBe(true)
    expect(body1.result.scheduleId).toBe('scd_new')
    expect(setConfig).toHaveBeenCalledWith('close_finished_matches_qstash_schedule_id', 'scd_new')

    const res2 = await freshPost(makeRequest({ action: 'setup-close-finished-matches-schedule' }))
    const body2 = await res2.json()
    expect(body2.result.already).toBe(true)
    expect(scheduleCreate).toHaveBeenCalledTimes(1)

    vi.doUnmock('@/infrastructure/supabase/AppConfigRepository')
    vi.doUnmock('@upstash/qstash')
  })

  it('defaults the disallowed-goal team to ceuta when not specified', async () => {
    const sendPush = vi.fn().mockResolvedValue({ sent: 0, total: 0 })
    vi.doMock('@/infrastructure/push/sendPush', () => ({ sendPush }))
    vi.doMock('@/app/api/cron/live/messages', () => ({
      MSG: { goalDisallowed: vi.fn((team: string) => ({ title: `title-${team}`, body: `body-${team}` })) },
    }))
    const { POST: freshPost } = await import('../route')

    const res = await freshPost(makeRequest({ action: 'goal-disallowed' }))
    const body = await res.json()
    expect(body.team).toBe('ceuta')

    vi.doUnmock('@/infrastructure/push/sendPush')
    vi.doUnmock('@/app/api/cron/live/messages')
  })

  it('recreates a schedule whose stored id no longer exists in QStash', async () => {
    const getConfig = vi.fn().mockResolvedValue('scd_gone')
    const setConfig = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@/infrastructure/supabase/AppConfigRepository', () => ({ getConfig, setConfig }))
    const scheduleCreate = vi.fn().mockResolvedValue({ scheduleId: 'scd_new' })
    vi.doMock('@upstash/qstash', () => ({
      Client: class { schedules = { create: scheduleCreate, get: vi.fn().mockRejectedValue(new Error('not found')) } },
    }))
    const { POST: freshPost } = await import('../route')
    const res = await freshPost(makeRequest({ action: 'setup-squad-schedule' }))
    const body = await res.json()
    expect(body.result.created).toBe(true)
    expect(setConfig).toHaveBeenCalledWith('squad_qstash_schedule_id', 'scd_new')
  })
})
