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

function extractMediaUrl(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null
  const url = (obj as Record<string, unknown>)['@_url']
  return typeof url === 'string' && url.length > 0 ? url : null
}

const EMOJI_HOSTS = ['s.w.org', 'twemoji']

function isValidImage(url: string): boolean {
  return !EMOJI_HOSTS.some((h) => url.includes(h)) &&
    !url.includes('youtube.com') &&
    !url.includes('youtu.be')
}

function extractImage(item: Record<string, unknown>): string | null {
  // Try media:thumbnail first, then media:content (Marca has empty thumbnail but valid content)
  const url = extractMediaUrl(item['media:thumbnail']) ?? extractMediaUrl(item['media:content'])
  if (url && isValidImage(url)) return url
  // enclosure
  const enclosure = item['enclosure']
  if (enclosure && typeof enclosure === 'object') {
    const url = (enclosure as Record<string, unknown>)['@_url']
    if (typeof url === 'string' && isValidImage(url)) return url
  }
  // content:encoded — extract first real image URL from HTML content
  const encoded = item['content:encoded']
  if (typeof encoded === 'string') {
    const matches = encoded.matchAll(/https?:\/\/[^\s"<>]+\.(?:jpg|jpeg|png|webp)/gi)
    for (const m of matches) {
      if (isValidImage(m[0])) {
        return m[0].replace(/-\d+x\d+(\.\w+)$/, '$1')
      }
    }
  }
  return null
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FunHubCeuta/1.0 RSS Reader' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    const imgUrl = match?.[1] ?? null
    return imgUrl && isValidImage(imgUrl) ? imgUrl : null
  } catch {
    return null
  }
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

  const mapped = items
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
    .filter((a) => a.externalId && a.url)

  // Fetch og:image in parallel for articles that have no image yet
  const withImages = await Promise.all(
    mapped.map(async (a) => {
      if (a.imageUrl) return a
      const ogImage = await fetchOgImage(a.url)
      return { ...a, imageUrl: ogImage }
    })
  )

  return withImages
}
