import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/push/sendPush', () => ({
  sendPush: vi.fn(),
}))
vi.mock('@/lib/constants', () => ({ SOURCE_LABELS: { oficial: 'Oficial', faro: 'Faro de Ceuta' } }))
vi.mock('@/lib/decodeEntities', () => ({ decodeEntities: (s: string) => s }))

import { sendPush } from '@/infrastructure/push/sendPush'
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

describe('sendNewsNotification', () => {
  it('returns zeros when sendPush returns zeros', async () => {
    vi.mocked(sendPush).mockResolvedValue({ sent: 0, total: 0 })
    const result = await sendNewsNotification(article)
    expect(result).toEqual({ recipients: 0, sentOk: 0, sentFail: 0 })
  })

  it('sends push to all subscribers and counts sentOk', async () => {
    vi.mocked(sendPush).mockResolvedValue({ sent: 1, total: 1 })
    const result = await sendNewsNotification(article)
    expect(result.recipients).toBe(1)
    expect(result.sentOk).toBe(1)
    expect(result.sentFail).toBe(0)
  })

  it('includes source label and title in push payload', async () => {
    vi.mocked(sendPush).mockResolvedValue({ sent: 1, total: 1 })
    await sendNewsNotification(article)
    expect(sendPush).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('Oficial'),
      })
    )
    expect(sendPush).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('Ceuta gana al Rival'),
      })
    )
  })

  it('counts sentFail correctly', async () => {
    vi.mocked(sendPush).mockResolvedValue({ sent: 0, total: 1 })
    const result = await sendNewsNotification(article)
    expect(result.sentFail).toBe(1)
    expect(result.sentOk).toBe(0)
  })

  it('counts partial success with multiple subs', async () => {
    vi.mocked(sendPush).mockResolvedValue({ sent: 1, total: 2 })
    const result = await sendNewsNotification(article)
    expect(result.recipients).toBe(2)
    expect(result.sentOk).toBe(1)
    expect(result.sentFail).toBe(1)
  })

  it('uses unknown source label fallback', async () => {
    vi.mocked(sendPush).mockResolvedValue({ sent: 1, total: 1 })
    await sendNewsNotification({ ...article, source: 'unknown_source' })
    expect(sendPush).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('Noticias'),
      })
    )
  })
})
