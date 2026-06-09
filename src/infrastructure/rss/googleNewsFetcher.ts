import { XMLParser } from 'fast-xml-parser'
import { ParsedArticle } from './RssFetcher'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

// Sources already covered by our own RSS scrapers — skip duplicates from Google News
const COVERED_SOURCES = ['el faro de ceuta', 'marca', 'mundo deportivo', '20 minutos', 'sport', 'ad ceuta fc', 'diario as', ' as']

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

async function resolveGoogleUrl(googleUrl: string): Promise<string> {
  try {
    const res = await fetch(googleUrl, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    })
    // After redirect, the final URL is the real article URL
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

      return {
        externalId: String(item.guid ?? googleUrl),
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
