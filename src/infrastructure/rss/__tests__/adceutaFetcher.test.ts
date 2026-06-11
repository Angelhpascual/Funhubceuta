import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchAdceutaOfficialNews } from '../adceutaFetcher'

vi.mock('@/infrastructure/storage/imageUploader', () => ({
  downloadAndUploadImage: vi.fn().mockResolvedValue('https://supabase.example.com/img.webp'),
}))

function makeWPPost(
  overrides: Partial<{
    id: number
    link: string
    date: string
    title: string
    excerpt: string
    imageUrl: string | null
  }> = {}
) {
  const {
    id = 1,
    link = 'https://adceutafc.com/noticia-1',
    date = '2026-05-25T09:00:00',
    title = 'Título de prueba',
    excerpt = '<p>Extracto de prueba.</p>',
    imageUrl = 'https://adceutafc.com/wp-content/uploads/img.jpg',
  } = overrides

  return {
    id,
    link,
    date,
    title: { rendered: title },
    excerpt: { rendered: excerpt },
    _embedded: imageUrl ? { 'wp:featuredmedia': [{ source_url: imageUrl }] } : {},
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('fetchAdceutaOfficialNews', () => {
  it('returns empty array when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const result = await fetchAdceutaOfficialNews()
    expect(result).toEqual([])
  })

  it('parses a WordPress post correctly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([makeWPPost()]),
      })
    )

    const result = await fetchAdceutaOfficialNews()
    expect(result).toHaveLength(1)
    expect(result[0].externalId).toBe('adceuta-wp-1')
    expect(result[0].title).toBe('Título de prueba')
    expect(result[0].source).toBe('oficial')
    expect(result[0].url).toBe('https://adceutafc.com/noticia-1')
  })

  it('parses publishedAt as ISO string', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([makeWPPost({ date: '2026-05-25T09:00:00' })]),
      })
    )

    const result = await fetchAdceutaOfficialNews()
    expect(result[0].publishedAt).toBe(new Date('2026-05-25T09:00:00').toISOString())
  })

  it('strips HTML tags from excerpt', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([makeWPPost({ excerpt: '<p>Texto <strong>limpio</strong>.</p>' })]),
      })
    )

    const result = await fetchAdceutaOfficialNews()
    expect(result[0].description).toBe('Texto limpio.')
  })

  it('decodes HTML entities in title', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([makeWPPost({ title: 'Ceuta &#8211; Andorra' })]),
      })
    )

    const result = await fetchAdceutaOfficialNews()
    expect(result[0].title).toBe('Ceuta – Andorra')
  })

  it('uploads image to Supabase and uses returned URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([makeWPPost()]),
      })
    )

    const result = await fetchAdceutaOfficialNews()
    expect(result[0].imageUrl).toBe('https://supabase.example.com/img.webp')
  })

  it('returns null imageUrl when post has no featured image', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([makeWPPost({ imageUrl: null })]),
      })
    )

    const result = await fetchAdceutaOfficialNews()
    expect(result[0].imageUrl).toBeNull()
  })

  it('requests the correct limit from WordPress API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', fetchMock)

    await fetchAdceutaOfficialNews(5)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('per_page=5'),
      expect.any(Object)
    )
  })
})
