import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/logCron', () => ({ logCron: vi.fn().mockResolvedValue(undefined) }))

const uploadMock = vi.fn().mockResolvedValue({ error: null })
const getPublicUrlMock = vi.fn().mockReturnValue({ data: { publicUrl: 'https://x.supabase.co/stored.webp' } })
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: { from: () => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock }) },
  }),
}))

const resizeMock = vi.fn()
const webpMock = vi.fn()
const toBufferMock = vi.fn().mockResolvedValue(Buffer.from('fake'))
vi.mock('sharp', () => ({
  default: () => {
    resizeMock.mockReturnValue({ webp: webpMock })
    webpMock.mockReturnValue({ toBuffer: toBufferMock })
    return { resize: resizeMock }
  },
}))

import { isStoredNewsImage, newsImageFilename, downloadAndUploadImage } from '../imageUploader'

beforeEach(() => {
  vi.clearAllMocks()
  uploadMock.mockResolvedValue({ error: null })
  getPublicUrlMock.mockReturnValue({ data: { publicUrl: 'https://x.supabase.co/stored.webp' } })
  toBufferMock.mockResolvedValue(Buffer.from('fake'))
})

describe('downloadAndUploadImage', () => {
  it('decodes HTML entities in the source URL before fetching (regression: a URL stored with a literal &amp; before RssFetcher\'s own decode fix retried the same broken URL forever)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
    })
    vi.stubGlobal('fetch', fetchMock)

    await downloadAndUploadImage(
      'https://img.asmedia.epimg.net/resizer/v2/ABC.jpg?auth=token&amp;width=1472&amp;height=828',
      'news/test'
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://img.asmedia.epimg.net/resizer/v2/ABC.jpg?auth=token&width=1472&height=828',
      expect.any(Object)
    )
    vi.unstubAllGlobals()
  })
})

describe('imageUploader helpers', () => {
  it('detects images already stored in Supabase', () => {
    expect(
      isStoredNewsImage('https://project.supabase.co/storage/v1/object/public/news-images/img.webp')
    ).toBe(true)
    expect(isStoredNewsImage('https://static.elpueblodeceuta.es/img.jpg')).toBe(false)
    expect(isStoredNewsImage(null)).toBe(false)
  })

  it('creates stable safe filenames from source and external id', () => {
    expect(newsImageFilename('El Pueblo', 'https://example.com/article?id=1')).toBe(
      newsImageFilename('El Pueblo', 'https://example.com/article?id=1')
    )
    expect(newsImageFilename('El Pueblo', 'id-1')).toMatch(/^el-pueblo-[a-f0-9]{16}$/)
  })
})
