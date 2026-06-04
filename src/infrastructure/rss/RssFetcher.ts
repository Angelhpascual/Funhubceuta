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

const EMOJI_HOSTS = ['s.w.org', 'twemoji', 'gravatar.com']
const IMG_EXT = /\.(?:jpg|jpeg|png|webp|gif|avif)(\?[^\s"<>]*)?$/i
const IMG_URL_RE = /https?:\/\/[^\s"<>]+\.(?:jpg|jpeg|png|webp|gif|avif)(?:\?[^\s"<>]*)?/gi

function isValidImage(url: string): boolean {
  return !EMOJI_HOSTS.some((h) => url.includes(h)) &&
    !url.includes('youtube.com') &&
    !url.includes('youtu.be') &&
    IMG_EXT.test(url.split('?')[0])
}

function firstValidImage(html: string): string | null {
  const matches = html.matchAll(IMG_URL_RE)
  for (const m of matches) {
    const url = m[0].replace(/-\d+x\d+(\.\w+)$/, '$1')
    if (isValidImage(url)) return url
  }
  return null
}

function extractImage(item: Record<string, unknown>): string | null {
  // media:thumbnail / media:content (standard RSS media tags)
  const url = extractMediaUrl(item['media:thumbnail']) ?? extractMediaUrl(item['media:content'])
  if (url && isValidImage(url)) return url
  // enclosure
  const enclosure = item['enclosure']
  if (enclosure && typeof enclosure === 'object') {
    const u = (enclosure as Record<string, unknown>)['@_url']
    if (typeof u === 'string' && isValidImage(u)) return u
  }
  // content:encoded — full HTML body
  const encoded = item['content:encoded']
  if (typeof encoded === 'string') {
    const found = firstValidImage(encoded)
    if (found) return found
  }
  // description — some feeds (El Pueblo) embed images here too
  const desc = item['description']
  if (typeof desc === 'string') {
    const found = firstValidImage(desc)
    if (found) return found
  }
  return null
}

// Meta tag patterns tried in order: og:image, twitter:image, schema.org image
const OG_PATTERNS = [
  /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  /<meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+itemprop=["']image["']/i,
]

async function fetchOgImage(articleUrl: string): Promise<string | null> {
  try {
    const res = await fetch(articleUrl, {
      headers: { 'User-Agent': 'FunHubCeuta/1.0 RSS Reader' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    // Read only first 50KB — enough to find the <head> meta tags
    const reader = res.body?.getReader()
    if (!reader) return null
    const chunks: Uint8Array[] = []
    let total = 0
    while (total < 50_000) {
      const { done, value } = await reader.read()
      if (done || !value) break
      chunks.push(value)
      total += value.length
    }
    reader.cancel()
    const html = new TextDecoder().decode(
      chunks.reduce((a, b) => { const c = new Uint8Array(a.length + b.length); c.set(a); c.set(b, a.length); return c }, new Uint8Array())
    )
    for (const re of OG_PATTERNS) {
      const m = html.match(re)
      if (m?.[1] && isValidImage(m[1])) return m[1]
    }
    return null
  } catch {
    return null
  }
}

function isRelevant(item: Record<string, unknown>, source: RssSource): boolean {
  // Feed already scoped to the club — accept everything
  if (source.keywords.length === 0) return true

  const text = [
    item.title,
    item.description,
    item['content:encoded'],
    item['media:keywords'],
    item['category'],
  ]
    .filter(Boolean)
    .map((v) => String(v).replace(/<[^>]+>/g, ' '))  // strip HTML tags
    .join(' ')
    .toLowerCase()

  // At least one BASE_KEYWORD must be present to avoid matching unrelated city news.
  // National press sources can provide broader baseKeywords via source.baseKeywords.
  const base = source.baseKeywords ?? BASE_KEYWORDS
  const hasBase = base.some((kw) => text.includes(kw.toLowerCase()))
  if (!hasBase) return false

  return source.keywords.some((kw) => text.includes(kw.toLowerCase()))
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
    .filter((item) => isRelevant(item, source))
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
