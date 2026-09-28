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

  it('returns queued:false when QSTASH_TOKEN is missing', async () => {
    delete process.env.QSTASH_TOKEN
    const res = await POST(makeRequest({ action: 'matches' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.result.queued).toBe(false)
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
})
