const DIRECT_DOMAINS = ['supabase.co']

export function proxyImage(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('/')) return url

  try {
    const hostname = new URL(url).hostname
    if (DIRECT_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`))) return url
  } catch {}

  return `/api/proxy/image?url=${encodeURIComponent(url)}`
}

// For team crests/logos: small size, aggressively cached at the edge
export function proxyLogo(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('/')) return url
  return `/api/proxy/image?url=${encodeURIComponent(url)}&w=64&q=85`
}
