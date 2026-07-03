import { describe, it, expect } from 'vitest'
import { proxyImage } from '../proxyImage'

describe('proxyImage', () => {
  it('returns null for null input', () => {
    expect(proxyImage(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(proxyImage(undefined)).toBeNull()
  })

  it('returns path as-is when starting with /', () => {
    expect(proxyImage('/uploads/player.jpg')).toBe('/uploads/player.jpg')
  })

  it('returns URL directly for supabase.co domain', () => {
    const url = 'https://onguesyapdtatsadsxmc.supabase.co/storage/v1/object/public/player.jpg'
    expect(proxyImage(url)).toBe(url)
  })

  it('proxies external URLs via /api/proxy/image', () => {
    const url = 'https://a.espncdn.com/combiner/i?img=photo.jpg'
    const result = proxyImage(url)
    expect(result).toBe(`/api/proxy/image?url=${encodeURIComponent(url)}`)
  })

  it('proxies non-supabase https URLs', () => {
    const url = 'https://example.com/image.jpg'
    expect(proxyImage(url)).toContain('/api/proxy/image')
  })

  it('returns null for empty string', () => {
    expect(proxyImage('')).toBeNull()
  })
})
