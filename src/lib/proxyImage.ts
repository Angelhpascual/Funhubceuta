const PROXY_DOMAINS = ['adceutafc.com']

export function proxyImage(url: string | null): string | null {
  if (!url) return null
  try {
    const hostname = new URL(url).hostname
    if (PROXY_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
      return `/api/proxy/image?url=${encodeURIComponent(url)}`
    }
  } catch {}
  return url
}
