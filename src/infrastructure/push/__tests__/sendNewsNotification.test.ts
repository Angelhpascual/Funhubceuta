import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}))
vi.mock('@/infrastructure/supabase/PushSubscriptionsRepository', () => ({
  getAllSubscriptions: vi.fn(),
  deleteSubscription: vi.fn(),
}))
vi.mock('@/lib/constants', () => ({ SOURCE_LABELS: { oficial: 'Oficial', faro: 'Faro de Ceuta' } }))
vi.mock('@/lib/decodeEntities', () => ({ decodeEntities: (s: string) => s }))

import webpush from 'web-push'
import { getAllSubscriptions, deleteSubscription } from '@/infrastructure/supabase/PushSubscriptionsRepository'
import { sendNewsNotification } from '../sendNewsNotification'
import type { ParsedArticle } from '@/infrastructure/rss/RssFetcher'

beforeEach(() => { vi.resetAllMocks() })

const article: ParsedArticle = {
  externalId: 'n1',
  title: 'Ceuta gana al Rival',
  source: 'oficial',
  url: 'https://adceuta.com/1',
  imageUrl: null,
  publishedAt: new Date().toISOString(),
  description: null,
}

const sub = { endpoint: 'https://push.example.com/1', p256dh: 'k', auth: 'a' }

describe('sendNewsNotification', () => {
  it('returns zeros when no subscriptions', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([])
    const result = await sendNewsNotification(article)
    expect(result).toEqual({ recipients: 0, sentOk: 0, sentFail: 0 })
    expect(webpush.sendNotification).not.toHaveBeenCalled()
  })

  it('sends push to all subscribers and counts sentOk', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([sub])
    vi.mocked(webpush.sendNotification).mockResolvedValue({ statusCode: 201 } as never)
    const result = await sendNewsNotification(article)
    expect(result.recipients).toBe(1)
    expect(result.sentOk).toBe(1)
    expect(result.sentFail).toBe(0)
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      expect.stringContaining('Ceuta gana al Rival')
    )
  })

  it('includes source label in payload body', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([sub])
    vi.mocked(webpush.sendNotification).mockResolvedValue({ statusCode: 201 } as never)
    await sendNewsNotification(article)
    const call = vi.mocked(webpush.sendNotification).mock.calls[0][1] as string
    const payload = JSON.parse(call)
    expect(payload.body).toContain('Oficial')
  })

  it('counts sentFail and deletes subscription on 410', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([sub])
    vi.mocked(webpush.sendNotification).mockRejectedValue(Object.assign(new Error('Gone'), { statusCode: 410 }))
    vi.mocked(deleteSubscription).mockResolvedValue(undefined)
    const result = await sendNewsNotification(article)
    expect(result.sentFail).toBe(1)
    expect(result.sentOk).toBe(0)
    expect(deleteSubscription).toHaveBeenCalledWith(sub.endpoint)
  })

  it('counts partial success with multiple subs', async () => {
    const sub2 = { endpoint: 'https://push.example.com/2', p256dh: 'k2', auth: 'a2' }
    vi.mocked(getAllSubscriptions).mockResolvedValue([sub, sub2])
    vi.mocked(webpush.sendNotification)
      .mockResolvedValueOnce({ statusCode: 201 } as never)
      .mockRejectedValueOnce(new Error('network'))
    const result = await sendNewsNotification(article)
    expect(result.recipients).toBe(2)
    expect(result.sentOk).toBe(1)
    expect(result.sentFail).toBe(1)
  })

  it('uses unknown source label fallback', async () => {
    vi.mocked(getAllSubscriptions).mockResolvedValue([sub])
    vi.mocked(webpush.sendNotification).mockResolvedValue({ statusCode: 201 } as never)
    await sendNewsNotification({ ...article, source: 'unknown_source' })
    const call = vi.mocked(webpush.sendNotification).mock.calls[0][1] as string
    const payload = JSON.parse(call)
    expect(payload.body).toContain('Noticias')
  })
})
