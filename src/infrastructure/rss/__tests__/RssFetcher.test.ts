import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchSource } from '../RssFetcher'
import type { RssSource } from '../sources'

const source: RssSource = {
  id: 'faro',
  name: 'El Faro de Ceuta',
  url: 'https://elfarodeceuta.es/feed/',
  keywords: [],
}

const sourceWithKeywords: RssSource = {
  id: 'elpueblo',
  name: 'El Pueblo de Ceuta',
  url: 'https://elpueblodeceuta.es/feed/',
  keywords: ['ceuta', 'ad ceuta'],
}

function makeRssFeed(items: string): string {
  return `<?xml version="1.0"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Test Feed</title>
    ${items}
  </channel>
</rss>`
}

function makeItem({
  title = 'Título de prueba',
  link = 'https://example.com/noticia-1',
  guid = 'https://example.com/noticia-1',
  pubDate = 'Mon, 25 May 2026 09:00:00 +0000',
  description = 'Descripción de prueba',
  mediaUrl = '',
}: {
  title?: string
  link?: string
  guid?: string
  pubDate?: string
  description?: string
  mediaUrl?: string
} = {}): string {
  return `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid>${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      ${mediaUrl ? `<media:thumbnail url="${mediaUrl}"/>` : ''}
    </item>`
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('fetchSource', () => {
  it('returns empty array when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const result = await fetchSource(source)
    expect(result).toEqual([])
  })

  it('parses a basic RSS item', async () => {
    const xml = makeRssFeed(makeItem())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))

    const result = await fetchSource(source)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Título de prueba')
    expect(result[0].url).toBe('https://example.com/noticia-1')
    expect(result[0].source).toBe('faro')
  })

  it('parses publishedAt as ISO string', async () => {
    const xml = makeRssFeed(makeItem({ pubDate: 'Mon, 25 May 2026 09:00:00 +0000' }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))

    const result = await fetchSource(source)
    expect(result[0].publishedAt).toBe(new Date('Mon, 25 May 2026 09:00:00 +0000').toISOString())
  })

  it('extracts media:thumbnail as imageUrl', async () => {
    const xml = makeRssFeed(makeItem({ mediaUrl: 'https://example.com/img.jpg' }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))

    const result = await fetchSource(source)
    expect(result[0].imageUrl).toBe('https://example.com/img.jpg')
  })

  it('returns null imageUrl when no media', async () => {
    const xml = makeRssFeed(makeItem())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))

    const result = await fetchSource(source)
    expect(result[0].imageUrl).toBeNull()
  })

  it('filters out items not matching keywords', async () => {
    const xml = makeRssFeed(
      makeItem({ title: 'Noticia de Málaga', description: 'El Málaga ganó' }) +
      makeItem({ title: 'El AD Ceuta remonta', link: 'https://example.com/2', guid: 'https://example.com/2' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))

    const result = await fetchSource(sourceWithKeywords)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('El AD Ceuta remonta')
  })

  it('accepts all items when keywords is empty', async () => {
    const xml = makeRssFeed(
      makeItem({ title: 'Noticia de Málaga' }) +
      makeItem({ title: 'El Ceuta remonta', link: 'https://example.com/2', guid: 'https://example.com/2' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))

    const result = await fetchSource(source)
    expect(result).toHaveLength(2)
  })

  it('truncates description to 300 chars', async () => {
    const long = 'a'.repeat(500)
    const xml = makeRssFeed(makeItem({ description: long }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))

    const result = await fetchSource(source)
    expect(result[0].description!.length).toBeLessThanOrEqual(300)
  })

  it('decodes HTML entities in title', async () => {
    const xml = makeRssFeed(makeItem({ title: 'Ceuta &#8211; Andorra' }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) }))

    const result = await fetchSource(source)
    expect(result[0].title).toBe('Ceuta – Andorra')
  })
})
