import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchGoogleNews } from '../googleNewsFetcher'

beforeEach(() => {
  vi.restoreAllMocks()
})

function makeGoogleFeed(items: string): string {
  return `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Google News</title>
    ${items}
  </channel>
</rss>`
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toUTCString()
}

function makeItem({
  title = 'AD Ceuta FC gana - El Confidencial',
  link = 'https://news.google.com/rss/articles/CBMitest',
  guid = 'CBMitest',
  pubDate = daysAgo(0),
}: {
  title?: string
  link?: string
  guid?: string
  pubDate?: string
} = {}): string {
  return `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid>${guid}</guid>
      <pubDate>${pubDate}</pubDate>
    </item>`
}

describe('fetchGoogleNews', () => {
  it('returns empty array when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const result = await fetchGoogleNews()
    expect(result).toEqual([])
  })

  it('parses a recent article and strips source from title', async () => {
    const xml = makeGoogleFeed(makeItem({ title: 'El Ceuta ficha nuevo delantero - El Confidencial', pubDate: daysAgo(0) }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))

    const result = await fetchGoogleNews()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('El Ceuta ficha nuevo delantero')
    expect(result[0].source).toBe('confidencial')
  })

  it('drops articles older than 7 days', async () => {
    const xml = makeGoogleFeed(makeItem({ pubDate: daysAgo(8), guid: 'old-guid' }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))

    const result = await fetchGoogleNews()
    expect(result).toHaveLength(0)
  })

  it('keeps articles exactly at 6 days old', async () => {
    const xml = makeGoogleFeed(makeItem({ pubDate: daysAgo(6), guid: 'recent-guid' }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))

    const result = await fetchGoogleNews()
    expect(result).toHaveLength(1)
  })

  it('deduplicates articles with the same guid', async () => {
    const xml = makeGoogleFeed(
      makeItem({ guid: 'dup-guid', link: 'https://news.google.com/rss/articles/CBMitest1' }) +
      makeItem({ guid: 'dup-guid', link: 'https://news.google.com/rss/articles/CBMitest2' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))

    const result = await fetchGoogleNews()
    expect(result).toHaveLength(1)
  })

  it('skips articles from covered sources (e.g. Marca)', async () => {
    const xml = makeGoogleFeed(
      makeItem({ title: 'Ceuta empata - Marca', guid: 'covered-1' }) +
      makeItem({ title: 'Ceuta vence - El Confidencial', guid: 'not-covered-1' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))

    const result = await fetchGoogleNews()
    // Marca is in COVERED_SOURCES, El Confidencial is not
    expect(result.every(a => a.source !== 'marca')).toBe(true)
    expect(result.some(a => a.source === 'confidencial')).toBe(true)
  })

  it('maps unknown source to "prensa"', async () => {
    const xml = makeGoogleFeed(makeItem({ title: 'Ceuta noticias - UnknownPress', guid: 'unknown-1' }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))

    const result = await fetchGoogleNews()
    expect(result[0].source).toBe('prensa')
  })
})
