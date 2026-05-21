import { XMLParser } from 'fast-xml-parser'
import { RssSource } from './sources'

export interface ParsedArticle {
  externalId: string
  title: string
  description: string | null
  url: string
  imageUrl: string | null
  source: string
  publishedAt: string | null
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

function extractImage(item: Record<string, unknown>): string | null {
  // media:thumbnail or media:content
  const media = item['media:thumbnail'] ?? item['media:content']
  if (media && typeof media === 'object') {
    const url = (media as Record<string, unknown>)['@_url']
    if (typeof url === 'string') return url
  }
  // enclosure
  const enclosure = item['enclosure']
  if (enclosure && typeof enclosure === 'object') {
    const url = (enclosure as Record<string, unknown>)['@_url']
    if (typeof url === 'string') return url
  }
  return null
}

function isRelevant(item: Record<string, unknown>, keywords: string[]): boolean {
  // Feed already scoped to the club — accept everything
  if (keywords.length === 0) return true

  const text = [
    item.title,
    item.description,
    item['media:keywords'],
    item['category'],
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return keywords.some((kw) => text.includes(kw.toLowerCase()))
}

function extractGuid(item: Record<string, unknown>): string {
  const guid = item.guid
  if (typeof guid === 'string') return guid
  // fast-xml-parser wraps text+attributes as { '#text': '...', '@_isPermaLink': '...' }
  if (guid && typeof guid === 'object') {
    const text = (guid as Record<string, unknown>)['#text']
    if (typeof text === 'string') return text
  }
  return String(item.link ?? '')
}

export async function fetchSource(source: RssSource): Promise<ParsedArticle[]> {
  const res = await fetch(source.url, {
    headers: { 'User-Agent': 'FunHubCeuta/1.0 RSS Reader' },
    next: { revalidate: 0 },
  })

  if (!res.ok) return []

  const xml = await res.text()
  const parsed = parser.parse(xml)
  const items: Record<string, unknown>[] = parsed?.rss?.channel?.item ?? []

  return items
    .filter((item) => isRelevant(item, source.keywords))
    .map((item) => ({
      externalId: extractGuid(item),
      title: String(item.title ?? '').replace(/<[^>]+>/g, '').trim(),
      description: item.description
        ? String(item.description).replace(/<[^>]+>/g, '').trim().slice(0, 300)
        : null,
      url: String(item.link ?? ''),
      imageUrl: extractImage(item),
      source: source.id,
      publishedAt: item.pubDate ? new Date(String(item.pubDate)).toISOString() : null,
    }))
    .filter((a) => a.externalId && a.url)
}
