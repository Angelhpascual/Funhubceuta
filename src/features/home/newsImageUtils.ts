import type { ImageLoaderProps } from 'next/image'

export const THUMB_COLORS = [
  'bg-ceuta-red',
  'bg-ceuta-black',
  'bg-ceuta-bg-mid',
  'bg-ceuta-red',
  'bg-ceuta-black',
  'bg-ceuta-bg-mid',
]

export function newsImageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src.startsWith('/api/proxy/image')) return src
  const params = new URLSearchParams(src.split('?')[1] ?? '')
  params.set('w', String(width))
  params.set('q', String(quality ?? 70))
  return `/api/proxy/image?${params.toString()}`
}

export function loaderFor(src: string) {
  return src.startsWith('/api/proxy/image') ? newsImageLoader : undefined
}

export function isStoredNewsImage(src: string): boolean {
  try {
    const url = new URL(src)
    return url.hostname.endsWith('.supabase.co') && url.pathname.includes('/news-images/')
  } catch {
    return false
  }
}
