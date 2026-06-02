import { XMLParser } from 'fast-xml-parser'
import { RssSource, BASE_KEYWORDS } from './sources'

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

function decodeEntities(str: string): string {
  return str
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
    .replace(/&[a-z]+;/gi, '')
}

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
  // content:encoded — extract first large image from WordPress HTML
  const encoded = item['content:encoded']
  if (typeof encoded === 'string') {
    const match = encoded.match(/https?:\/\/[^\s"<>]+\/wp-content\/uploads\/[^\s"<>]+\.(?:jpg|jpeg|png|webp)/i)
    if (match) {
      // Prefer the original (non-resized) version
      const original = match[0].replace(/-\d+x\d+(\.\w+)$/, '$1')
      return original
    }
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

  // A BASE_KEYWORD (unambiguously identifies the club) must always be present.
  // Squad-name-only matches are discarded to avoid generic-name false positives.
  const hasBase = BASE_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()))
  if (!hasBase) return false

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
  const raw = parsed?.rss?.channel?.item ?? []
  const items: Record<string, unknown>[] = Array.isArray(raw) ? raw : [raw]

  return items
    .filter((item) => isRelevant(item, source.keywords))
    .map((item) => ({
      externalId: extractGuid(item),
      title: decodeEntities(String(item.title ?? '').replace(/<[^>]+>/g, '')).trim(),
      description: item.description
        ? decodeEntities(String(item.description).replace(/<[^>]+>/g, '').trim()).slice(0, 300)
        : null,
      url: String(item.link ?? ''),
      imageUrl: extractImage(item),
      source: source.id,
      publishedAt: item.pubDate ? new Date(String(item.pubDate)).toISOString() : null,
    }))
    .filter((a) => a.externalId && a.url && a.imageUrl && !a.imageUrl.includes('youtube.com') && !a.imageUrl.includes('youtu.be'))
}
