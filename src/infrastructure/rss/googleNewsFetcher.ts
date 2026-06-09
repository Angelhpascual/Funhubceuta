import { XMLParser } from 'fast-xml-parser'
import { ParsedArticle } from './RssFetcher'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

// Sources already covered by our own RSS scrapers — skip duplicates from Google News
const COVERED_SOURCES = ['el faro de ceuta', 'marca', 'mundo deportivo', '20 minutos', 'sport', 'ad ceuta fc', 'diario as', ' as', 'ceuta televisión', 'ceuta television', 'ceuta actualidad', 'el pueblo de ceuta', 'radio televisión ceuta', 'radio television ceuta', 'rtvce']

// Map Google News source names to our internal source IDs
const SOURCE_MAP: Record<string, string> = {
  'diario as': 'as',
  'as': 'as',
  'el confidencial': 'confidencial',
  'abc': 'abc',
  'la vanguardia': 'lavanguardia',
  'cope': 'cope',
  'cadena ser': 'ser',
  'el pueblo de ceuta': 'elpueblo',
  'ceuta televisión': 'ceutatv',
  'ceuta television': 'ceutatv',
  'radio televisión ceuta': 'rtvc',
  'radio television ceuta': 'rtvc',
  'rtvce': 'rtvc',
  'la verdad de ceuta': 'laverdad',
  'ceuta actualidad': 'ceutaactualidad',
  'ceuta al día': 'ceutaaldia',
  'ceuta al dia': 'ceutaaldia',
  'onefootball': 'onefootball',
  'el país': 'elpais',
  'el pais': 'elpais',
  'rtve': 'rtve',
  'rtve.es': 'rtve',
  'goal.com': 'goal',
  'elgoldigital': 'elgoldigital',
  'el gol digital': 'elgoldigital',
  'fondo segunda': 'fondosegunda',
  'transfermarkt': 'transfermarkt',
}

// Decode the real article URL from a Google News RSS link.
// Google News encodes the URL as a base64url protobuf in the CBM... path segment.
function decodeGoogleNewsUrl(googleUrl: string): string | null {
  try {
    const match = googleUrl.match(/articles\/(CB[A-Za-z0-9_-]+)/)
    if (!match) return null
    // base64url → base64 → Buffer
    const b64 = match[1].replace(/-/g, '+').replace(/_/g, '/')
    const buf = Buffer.from(b64, 'base64')
    // Protobuf: field 1 (tag 0x0a), varint length, then URL bytes
    if (buf[0] !== 0x0a) return null
    let pos = 1
    let len = 0
    let shift = 0
    while (pos < buf.length) {
      const b = buf[pos++]
      len |= (b & 0x7f) << shift
      if (!(b & 0x80)) break
      shift += 7
    }
    const url = buf.slice(pos, pos + len).toString('utf8')
    if (url.startsWith('http') && !url.includes('news.google.com')) return url
    return null
  } catch {
    return null
  }
}

async function resolveGoogleUrl(googleUrl: string): Promise<string> {
  // Try protobuf decode first (no network needed)
  const decoded = decodeGoogleNewsUrl(googleUrl)
  if (decoded) return decoded

  // Fallback: HTTP GET with browser headers
  try {
    const res = await fetch(googleUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
    })
    if (res.url && !res.url.includes('news.google.com')) return res.url
  } catch {
    // ignore
  }
  return googleUrl
}

export async function fetchGoogleNews(): Promise<ParsedArticle[]> {
  const url = 'https://news.google.com/rss/search?q=%22AD+Ceuta%22+f%C3%BAtbol&hl=es&gl=ES&ceid=ES:es'

  const res = await fetch(url, {
    headers: { 'User-Agent': 'FunHubCeuta/1.0 RSS Reader' },
    next: { revalidate: 0 },
  })
  if (!res.ok) return []

  const xml = await res.text()
  const parsed = parser.parse(xml)
  const raw = parsed?.rss?.channel?.item ?? []
  const items: Record<string, unknown>[] = Array.isArray(raw) ? raw : [raw]

  // Parse title and source — Google News format: "Article title - Source Name"
  const parsed_items = items.map((item) => {
    const fullTitle = String(item.title ?? '').trim()
    const lastDash = fullTitle.lastIndexOf(' - ')
    const title = lastDash > 0 ? fullTitle.slice(0, lastDash).trim() : fullTitle
    const sourceName = lastDash > 0 ? fullTitle.slice(lastDash + 3).trim() : ''

    return { item, title, sourceName: sourceName.toLowerCase() }
  })

  // Skip articles from sources we already scrape directly
  const filtered = parsed_items.filter(({ sourceName }) =>
    !COVERED_SOURCES.some((s) => sourceName.includes(s))
  )

  if (filtered.length === 0) return []

  // Resolve Google redirect URLs in parallel to get real article URLs
  const resolved = await Promise.all(
    filtered.map(async ({ item, title, sourceName }) => {
      const googleUrl = String(item.link ?? '')
      const realUrl = await resolveGoogleUrl(googleUrl)
      const sourceId = Object.entries(SOURCE_MAP).find(([k]) => sourceName.includes(k))?.[1] ?? 'prensa'

      const rawGuid = item.guid
      const guidStr = rawGuid && typeof rawGuid === 'object'
        ? String((rawGuid as Record<string, unknown>)['#text'] ?? googleUrl)
        : String(rawGuid ?? googleUrl)

      return {
        externalId: guidStr,
        title,
        description: null,
        url: realUrl,
        imageUrl: null,
        source: sourceId,
        publishedAt: item.pubDate ? new Date(String(item.pubDate)).toISOString() : null,
      } satisfies ParsedArticle
    })
  )

  const seen = new Set<string>()
  return resolved.filter((a) => {
    if (!a.externalId || !a.url) return false
    if (seen.has(a.externalId)) return false
    seen.add(a.externalId)
    return true
  })
}
