import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'events'

vi.mock('node:https', () => ({
  default: { request: vi.fn() },
  request: vi.fn(),
}))

import https from 'node:https'
import { scrapeLatestTweets } from '../twitterScraper'

function mockResponse(statusCode: number, body: string) {
  const req = new EventEmitter() as EventEmitter & { end: () => void }
  req.end = vi.fn()

  vi.mocked(https.request).mockImplementation(((_options: unknown, callback: (res: EventEmitter & { statusCode: number }) => void) => {
    const res = new EventEmitter() as EventEmitter & { statusCode: number }
    res.statusCode = statusCode
    // Simulate async delivery of the response body
    queueMicrotask(() => {
      callback(res)
      res.emit('data', Buffer.from(body))
      res.emit('end')
    })
    return req
  }) as never)

  return req
}

function tweetJson(id: string, text: string, createdAt = 'Mon Sep 01 10:00:00 +0000 2026', mediaUrl?: string) {
  return `{"id_str":"${id}","full_text":"${text}","created_at":"${createdAt}"${mediaUrl ? `,"media_url_https":"${mediaUrl}"` : ''}}`
}

beforeEach(() => { vi.resetAllMocks() })

describe('scrapeLatestTweets', () => {
  it('rejects when the syndication endpoint does not return 200', async () => {
    mockResponse(503, '')
    await expect(scrapeLatestTweets()).rejects.toThrow('Twitter syndication failed: 503')
  })

  it('parses id/text/date/image from the embedded JSON fragments', async () => {
    mockResponse(200, tweetJson('1', 'Vamos Ceuta', 'Mon Sep 01 10:00:00 +0000 2026', 'https://pbs.twimg.com/1.jpg'))
    const result = await scrapeLatestTweets()
    expect(result).toEqual([{
      tweetId: '1',
      text: 'Vamos Ceuta',
      createdAt: new Date('Mon Sep 01 10:00:00 +0000 2026').toISOString(),
      url: 'https://twitter.com/ADCeuta_FC/status/1',
      imageUrl: 'https://pbs.twimg.com/1.jpg',
    }])
  })

  it('cleans up escaped newlines/quotes and strips t.co links', async () => {
    mockResponse(200, tweetJson('1', 'Linea 1\\nLinea 2 \\"cita\\" https://t.co/abc123'))
    const result = await scrapeLatestTweets()
    expect(result[0].text).toBe('Linea 1\nLinea 2 "cita"')
  })

  it('deduplicates repeated tweet ids', async () => {
    const body = [tweetJson('1', 'Primero'), tweetJson('1', 'Repetido'), tweetJson('2', 'Segundo')].join(',')
    mockResponse(200, body)
    const result = await scrapeLatestTweets()
    expect(result.map((t) => t.tweetId)).toEqual(['1', '2'])
  })

  it('skips a tweet whose text is empty after cleanup (e.g. just a t.co link)', async () => {
    const body = [tweetJson('1', 'https://t.co/onlylink'), tweetJson('2', 'Texto real')].join(',')
    mockResponse(200, body)
    const result = await scrapeLatestTweets()
    expect(result.map((t) => t.tweetId)).toEqual(['2'])
  })

  it('respects the limit parameter', async () => {
    const body = Array.from({ length: 5 }, (_, i) => tweetJson(String(i), `Tweet ${i}`)).join(',')
    mockResponse(200, body)
    const result = await scrapeLatestTweets('ADCeuta_FC', 3)
    expect(result).toHaveLength(3)
  })

  it('defaults imageUrl to null when there is no media', async () => {
    mockResponse(200, tweetJson('1', 'Sin imagen'))
    const result = await scrapeLatestTweets()
    expect(result[0].imageUrl).toBeNull()
  })

  it('defaults createdAt to null when the date is missing', async () => {
    mockResponse(200, '{"id_str":"1","full_text":"Sin fecha"}')
    const result = await scrapeLatestTweets()
    expect(result[0].createdAt).toBeNull()
  })

  it('builds the tweet URL from the given screenName', async () => {
    mockResponse(200, tweetJson('1', 'Hola'))
    const result = await scrapeLatestTweets('OtroUsuario')
    expect(result[0].url).toBe('https://twitter.com/OtroUsuario/status/1')
  })
})
