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

// Mirrors how AS/Mundo Deportivo are actually configured in sources.ts:
// football-only feeds, so standalone " ceuta " is allowed as a base keyword.
const sourceNational: RssSource = {
  id: 'as',
  name: 'AS',
  url: 'https://feeds.as.com/example',
  keywords: ['ceuta', 'ad ceuta'],
  baseKeywords: ['ad ceuta', 'el ceuta', 'del ceuta', 'al ceuta', ' ceuta '],
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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(source)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Título de prueba')
    expect(result[0].url).toBe('https://example.com/noticia-1')
    expect(result[0].source).toBe('faro')
  })

  it('parses publishedAt as ISO string', async () => {
    const xml = makeRssFeed(makeItem({ pubDate: 'Mon, 25 May 2026 09:00:00 +0000' }))
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(source)
    expect(result[0].publishedAt).toBe(new Date('Mon, 25 May 2026 09:00:00 +0000').toISOString())
  })

  it('extracts media:thumbnail as imageUrl', async () => {
    const xml = makeRssFeed(makeItem({ mediaUrl: 'https://example.com/img.jpg' }))
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(source)
    expect(result[0].imageUrl).toBe('https://example.com/img.jpg')
  })

  it('returns null imageUrl when no media', async () => {
    const xml = makeRssFeed(makeItem())
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(source)
    expect(result[0].imageUrl).toBeNull()
  })

  it('accepts .jfif image URLs (AS.com format)', async () => {
    const xml = makeRssFeed(makeItem({ mediaUrl: 'https://img.asmedia.epimg.net/photo.jfif' }))
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(source)
    expect(result[0].imageUrl).toBe('https://img.asmedia.epimg.net/photo.jfif')
  })

  it('extracts .jfif image URL from description HTML', async () => {
    const desc = '<![CDATA[<p><img src="https://img.asmedia.epimg.net/photo.jfif" /></p>]]>'
    const xml = makeRssFeed(makeItem({ description: desc }))
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(source)
    expect(result[0].imageUrl).toBe('https://img.asmedia.epimg.net/photo.jfif')
  })

  it('decodes &amp; in AS.com resizer image URLs instead of passing the literal entity through (regression: broke the signed auth= param, causing HTTP 400 on every AS image download)', async () => {
    const desc =
      '<![CDATA[<p><img src="https://img.asmedia.epimg.net/resizer/v2/ABC123.jpg?auth=signedtoken&amp;width=1472&amp;height=828" /></p>]]>'
    const xml = makeRssFeed(makeItem({ description: desc }))
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(source)
    expect(result[0].imageUrl).toBe(
      'https://img.asmedia.epimg.net/resizer/v2/ABC123.jpg?auth=signedtoken&width=1472&height=828'
    )
  })

  it('extracts Teleceuta data-img-url images from description HTML', async () => {
    const image =
      'https://teleceuta.fra1.digitaloceanspaces.com/media/2026/06/15100025/Noticia-actualidad-33-120-696x364.jpg'
    const desc = `<![CDATA[<span class="entry-thumb" data-img-url="${image}"></span>]]>`
    const xml = makeRssFeed(
      makeItem({
        title: 'El AD Ceuta refuerza su filial con Yaya Bodian',
        description: desc,
      })
    )
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(source)
    expect(result[0].imageUrl).toBe(image)
  })

  it('rejects articles about Ceuta Depor even if they match base keywords', async () => {
    const xml = makeRssFeed(
      makeItem({
        title: 'Entradas para el Ceuta Depor',
        description: 'El Ceuta Depor vende entradas',
      })
    )
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(sourceWithKeywords)
    expect(result).toHaveLength(0)
  })

  it('rejects articles about Atlético Ceuta', async () => {
    const xml = makeRssFeed(
      makeItem({ title: 'El Atlético Ceuta asciende', description: 'victoria del atlético ceuta' })
    )
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(sourceWithKeywords)
    expect(result).toHaveLength(0)
  })

  it('filters out items not matching keywords', async () => {
    const xml = makeRssFeed(
      makeItem({ title: 'Noticia de Málaga', description: 'El Málaga ganó' }) +
        makeItem({
          title: 'El AD Ceuta remonta',
          link: 'https://example.com/2',
          guid: 'https://example.com/2',
        })
    )
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(sourceWithKeywords)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('El AD Ceuta remonta')
  })

  it('accepts all items when keywords is empty', async () => {
    const xml = makeRssFeed(
      makeItem({ title: 'Noticia de Málaga' }) +
        makeItem({
          title: 'El Ceuta remonta',
          link: 'https://example.com/2',
          guid: 'https://example.com/2',
        })
    )
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(source)
    expect(result).toHaveLength(2)
  })

  it('truncates description to 300 chars', async () => {
    const long = 'a'.repeat(500)
    const xml = makeRssFeed(makeItem({ description: long }))
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(source)
    expect(result[0].description!.length).toBeLessThanOrEqual(300)
  })

  it('returns null imageUrl without fetching og:image (done by syncNews instead)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(makeRssFeed(makeItem())) })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchSource(source)
    expect(result[0].imageUrl).toBeNull()
    // Only one fetch call: the RSS feed itself, no og:image fetch
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects a "TV, horario y cómo ver" match preview for OTHER teams even when the body mentions Ceuta in passing (regression: national press like AS/Mundo Deportivo publishes one of these per Segunda División fixture, and the embedded standings table/aside was enough to pass the keyword check, polluting the queue with off-topic match-guide articles)', async () => {
    const xml = makeRssFeed(
      makeItem({
        title: 'Real Valladolid-Córdoba CF: TV, horario y cómo ver LaLiga Hypermotion online',
        description: 'Repasamos la clasificación, donde el Ceuta aparece en mitad de tabla.',
      })
    )
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(sourceNational)
    expect(result).toHaveLength(0)
  })

  it('keeps a "TV, horario y cómo ver" match preview when Ceuta is actually one of the two named teams', async () => {
    const xml = makeRssFeed(
      makeItem({
        title: 'Ceuta - Sporting: TV, horario y cómo ver LaLiga Hypermotion online',
        description: 'El Ceuta recibe al Sporting de Gijón este domingo en el Murube.',
      })
    )
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(sourceNational)
    expect(result).toHaveLength(1)
  })

  it('decodes HTML entities in title', async () => {
    const xml = makeRssFeed(makeItem({ title: 'Ceuta &#8211; Andorra' }))
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(xml) })
    )

    const result = await fetchSource(source)
    expect(result[0].title).toBe('Ceuta – Andorra')
  })
})
