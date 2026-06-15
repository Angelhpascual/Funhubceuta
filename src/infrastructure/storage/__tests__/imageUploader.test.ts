import { describe, expect, it } from 'vitest'
import { isStoredNewsImage, newsImageFilename } from '../imageUploader'

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
