import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isFootball, fetchCeutaDeportiva } from '../ceutadeportivaFetcher'

// ─── isFootball unit tests ────────────────────────────────────────────────────

describe('isFootball', () => {
  // Football positives
  it('accepts a ceuta football article', () => {
    expect(isFootball('El Ceuta firma un nuevo delantero', 'https://ceutadeportiva.com/2026/06/ceuta-nuevo-delantero')).toBe(true)
  })

  it('accepts an article about fichaje', () => {
    expect(isFootball('Fichaje confirmado para el Ceuta FC', 'https://ceutadeportiva.com/2026/06/fichaje-ceuta')).toBe(true)
  })

  it('accepts a plantilla article', () => {
    expect(isFootball('La plantilla del Ceuta presenta novedades', 'https://ceutadeportiva.com/2026/06/plantilla-ceuta')).toBe(true)
  })

  // Waterpolo exclusions
  it('rejects a waterpolo article even if it mentions ceuta', () => {
    expect(isFootball('El CN Caballa representa a Ceuta en el campeonato de waterpolo', 'https://ceutadeportiva.com/2026/06/caballa-waterpolo')).toBe(false)
  })

  it('rejects water polo (two words)', () => {
    expect(isFootball('El Ceuta destaca en water polo nacional', 'https://ceutadeportiva.com/2026/06/water-polo')).toBe(false)
  })

  it('rejects cn caballa article', () => {
    expect(isFootball('El CN Caballa clasifica para la final', 'https://ceutadeportiva.com/2026/06/cn-caballa-final')).toBe(false)
  })

  // Other sports exclusions
  it('rejects a natación article', () => {
    expect(isFootball('Ceuta brilla en natación', 'https://ceutadeportiva.com/2026/06/natacion-ceuta')).toBe(false)
  })

  it('rejects a baloncesto article', () => {
    expect(isFootball('El baloncesto ceutí suma otra victoria', 'https://ceutadeportiva.com/2026/06/baloncesto')).toBe(false)
  })

  it('rejects a padel article', () => {
    expect(isFootball('Torneo de pádel en Ceuta', 'https://ceutadeportiva.com/2026/06/padel')).toBe(false)
  })

  it('rejects an alevines article', () => {
    expect(isFootball('Los alevines del Ceuta viajan a Madrid', 'https://ceutadeportiva.com/2026/06/alevines-ceuta')).toBe(false)
  })

  it('rejects a juveniles article', () => {
    expect(isFootball('Los juveniles del Ceuta ganan la liga', 'https://ceutadeportiva.com/2026/06/juveniles-ceuta')).toBe(false)
  })

  it('rejects a campeonato de españa de waterpolo (via exclusion phrase)', () => {
    expect(isFootball('Los alevines del CN Caballa en el campeonato de españa de natación', 'https://ceutadeportiva.com/2026/06/campeonato-espana')).toBe(false)
  })

  // No match at all — note: the URL contains "ceutadeportiva" which includes "ceuta",
  // so we test with a title+url combo that has zero football keywords
  it('rejects an article with no football keywords', () => {
    expect(isFootball('Turismo y gastronomía en la región', 'https://example.com/2026/06/turismo')).toBe(false)
  })

  // Case insensitivity
  it('is case-insensitive for keywords', () => {
    expect(isFootball('WATERPOLO en Ceuta', 'https://ceutadeportiva.com/2026/06/waterpolo')).toBe(false)
    expect(isFootball('FICHAJE del Ceuta', 'https://ceutadeportiva.com/2026/06/fichaje')).toBe(true)
  })
})

// ─── fetchCeutaDeportiva integration (mocked fetch) ──────────────────────────

function makeArticleHtml(overrides: {
  title?: string
  image?: string
  description?: string
  publishedAt?: string
} = {}) {
  const {
    title = 'El Ceuta ficha a un nuevo portero',
    image = 'https://ceutadeportiva.com/wp-content/uploads/portero.jpg',
    description = 'El club anuncia el fichaje.',
    publishedAt = '2026-06-15T10:00:00+00:00',
  } = overrides

  return `
    <html>
      <head>
        <meta property="og:title" content="${title}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:description" content="${description}" />
        <meta property="article:published_time" content="${publishedAt}" />
      </head>
    </html>
  `
}

function makeHomepageHtml(urls: string[]) {
  return urls.map((u) => `<a href="${u}">link</a>`).join('\n')
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('fetchCeutaDeportiva', () => {
  it('returns empty array when homepage fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const result = await fetchCeutaDeportiva()
    expect(result).toEqual([])
  })

  it('parses a football article correctly', async () => {
    const articleUrl = 'https://ceutadeportiva.com/2026/06/ceuta-ficha-portero'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(makeHomepageHtml([articleUrl])) })
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(makeArticleHtml()) })
    )

    const result = await fetchCeutaDeportiva(1)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('El Ceuta ficha a un nuevo portero')
    expect(result[0].source).toBe('ceutadeportiva')
    expect(result[0].url).toBe(articleUrl)
    expect(result[0].imageUrl).toBe('https://ceutadeportiva.com/wp-content/uploads/portero.jpg')
  })

  it('strips " - Ceuta Deportiva" suffix from title', async () => {
    const articleUrl = 'https://ceutadeportiva.com/2026/06/ceuta-fichaje'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(makeHomepageHtml([articleUrl])) })
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(makeArticleHtml({ title: 'Nuevo fichaje para el Ceuta - Ceuta Deportiva' })) })
    )

    const result = await fetchCeutaDeportiva(1)
    expect(result[0].title).toBe('Nuevo fichaje para el Ceuta')
  })

  it('filters out non-football articles', async () => {
    const footballUrl = 'https://ceutadeportiva.com/2026/06/ceuta-fichaje'
    const waterpoloUrl = 'https://ceutadeportiva.com/2026/06/ceuta-waterpolo'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(makeHomepageHtml([footballUrl, waterpoloUrl])) })
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(makeArticleHtml({ title: 'El Ceuta ficha a un delantero' })) })
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(makeArticleHtml({ title: 'El Ceuta gana en waterpolo' })) })
    )

    const result = await fetchCeutaDeportiva(2)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('El Ceuta ficha a un delantero')
  })

  it('deduplicates URLs from homepage', async () => {
    const url = 'https://ceutadeportiva.com/2026/06/ceuta-partido'
    const homepageWithDupes = makeHomepageHtml([url, url, url])
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(homepageWithDupes) })
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(makeArticleHtml()) })
    )

    const result = await fetchCeutaDeportiva(5)
    expect(result).toHaveLength(1)
  })

  it('returns empty array when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const result = await fetchCeutaDeportiva()
    expect(result).toEqual([])
  })
})
