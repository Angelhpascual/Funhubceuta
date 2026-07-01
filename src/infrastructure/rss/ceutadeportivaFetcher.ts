import type { ParsedArticle } from './RssFetcher'

const BASE = 'https://ceutadeportiva.com'
const SOURCE = 'ceutadeportiva'

const FOOTBALL_KEYWORDS = [
  'ceuta', 'bodiger', 'kone', 'koné', 'murube', 'caballa', 'fichaje', 'renovacion',
  'salida', 'jugador', 'entrenador', 'plantilla', 'mercado', 'segunda', 'laliga',
]

// Exclude articles that are clearly about other sports or non-club content
const OTHER_SPORT_KEYWORDS = [
  'waterpolo', 'water polo', 'natacion', 'natación', 'atletismo', 'baloncesto',
  'basketball', 'balonmano', 'handbal', 'tenis', 'padel', 'pádel', 'ciclismo',
  'boxeo', 'judo', 'karate', 'ajedrez', 'voleibol', 'rugby', 'hockey',
  'cn caballa', 'club natacion', 'club náutico', 'triatlon', 'triatlón',
  'alevines', 'juveniles', 'benjamin', 'benjamín', 'infantil',
  'campeonato de españa de', 'liga nacional de',
  // Non-football city/institution content
  'icd', 'instituto ceutí de deportes', 'instituto ceuti', 'leyendas del deporte',
  'exposición', 'exposicion', 'inauguración', 'inauguracion', 'escuela deportiva',
  'deporte escolar', 'deporte base', 'deporte femenino ceuta',
]

export function isFootball(title: string, url: string): boolean {
  // Only evaluate the slug part of the URL, not the domain (which always contains "ceuta")
  const slug = url.replace(/^https?:\/\/[^/]+/, '')
  const text = (title + ' ' + slug).toLowerCase()
  if (OTHER_SPORT_KEYWORDS.some((kw) => text.includes(kw))) return false
  return FOOTBALL_KEYWORDS.some((kw) => text.includes(kw))
}

function slugToId(url: string): string {
  return url.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '').replace(/\//g, '_')
}

export async function fetchCeutaDeportiva(limit = 15): Promise<ParsedArticle[]> {
  let html: string
  try {
    const res = await fetch(BASE, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    html = await res.text()
  } catch {
    return []
  }

  // Extract article URLs from homepage (WordPress date-based permalinks)
  const urlPattern = /href="(https:\/\/ceutadeportiva\.com\/\d{4}\/\d{2}\/[^"#?]+)"/g
  const seen = new Set<string>()
  const urls: string[] = []
  let match
  while ((match = urlPattern.exec(html)) !== null) {
    const url = match[1].replace(/\/$/, '')
    if (!seen.has(url)) {
      seen.add(url)
      urls.push(url)
    }
    if (urls.length >= limit * 2) break
  }

  // Fetch each article page to get OG meta
  const articles: ParsedArticle[] = []

  await Promise.allSettled(
    urls.slice(0, limit).map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
          },
          signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) return
        const html = await res.text()

        const title = (html.match(/property="og:title" content="([^"]+)"/) ||
          html.match(/content="([^"]+)" property="og:title"/))?.[1]
        if (!title) return

        // Skip non-football articles
        if (!isFootball(title, url)) return

        const image = (html.match(/property="og:image" content="([^"]+)"/) ||
          html.match(/content="([^"]+)" property="og:image"/))?.[1]
        const description = (html.match(/property="og:description" content="([^"]+)"/) ||
          html.match(/content="([^"]+)" property="og:description"/))?.[1]
        const publishedAt = (html.match(/property="article:published_time" content="([^"]+)"/) ||
          html.match(/content="([^"]+)" property="article:published_time"/))?.[1]

        const externalId = slugToId(url)

        articles.push({
          externalId,
          source: SOURCE,
          title: title.replace(' - Ceuta Deportiva', '').trim(),
          description: description ?? null,
          url,
          imageUrl: image ?? null,
          publishedAt: publishedAt ?? null,
        })
      } catch {
        // skip
      }
    })
  )

  // Sort newest first
  return articles.sort((a, b) =>
    (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')
  )
}
