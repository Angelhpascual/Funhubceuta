import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/PushSubscriptionsRepository', () => ({
  getAllSubscriptions: vi.fn(),
  deleteSubscription: vi.fn(),
}))
vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}))

import { getAllSubscriptions, deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import webpush from 'web-push'
import { notifyAdmin } from '../notifyAdmin'

beforeEach(() => { vi.resetAllMocks() })

const adminSub = { endpoint: 'https://push.example.com/admin', p256dh: 'k', auth: 'a' }

describe('notifyAdmin', () => {
  it('does nothing when no admin subscriptions', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([])
    const result = await notifyAdmin('Título', 'Cuerpo')
    expect(webpush.sendNotification).not.toHaveBeenCalled()
    expect(result).toEqual({ sent: 0, total: 0 })
  })

  it('asks the repository for admin-only subscriptions', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([])
    await notifyAdmin('Título', 'Cuerpo')
    expect(getAllSubscriptions).toHaveBeenCalledWith({ adminOnly: true })
  })

  it('sends push to admin subscribers and reports counts', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([adminSub])
    vi.mocked(webpush.sendNotification).mockResolvedValue({ statusCode: 201 } as never)
    const result = await notifyAdmin('📬 Noticia', 'Ceuta gana')
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: adminSub.endpoint, keys: { p256dh: adminSub.p256dh, auth: adminSub.auth } },
      expect.stringContaining('Ceuta gana')
    )
    expect(result).toEqual({ sent: 1, total: 1 })
  })

  it('does not throw if sendNotification fails, and reports it as unsent (regression: failures used to be fully silent)', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([adminSub])
    vi.mocked(webpush.sendNotification).mockRejectedValue(new Error('push failed'))
    const result = await notifyAdmin('Test', 'Body')
    expect(result).toEqual({ sent: 0, total: 1 })
  })

  it('deletes a stale subscription on 410 Gone (regression: dead admin sub used to fail forever, silently)', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([adminSub])
    vi.mocked(webpush.sendNotification).mockRejectedValue(Object.assign(new Error('Gone'), { statusCode: 410 }))
    vi.mocked(deleteSubscription).mockResolvedValue(undefined)
    await notifyAdmin('Test', 'Body')
    expect(deleteSubscription).toHaveBeenCalledWith(adminSub.endpoint)
  })

  it('deletes a stale subscription on 404 Not Found', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([adminSub])
    vi.mocked(webpush.sendNotification).mockRejectedValue(Object.assign(new Error('Not Found'), { statusCode: 404 }))
    vi.mocked(deleteSubscription).mockResolvedValue(undefined)
    await notifyAdmin('Test', 'Body')
    expect(deleteSubscription).toHaveBeenCalledWith(adminSub.endpoint)
  })

  it('does not delete the subscription on a transient error (e.g. network)', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([adminSub])
    vi.mocked(webpush.sendNotification).mockRejectedValue(new Error('network blip'))
    await notifyAdmin('Test', 'Body')
    expect(deleteSubscription).not.toHaveBeenCalled()
  })
})
