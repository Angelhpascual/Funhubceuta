const PROXY_DOMAINS = ['adceutafc.com']

export function proxyImage(url: string | null): string | null {
  if (!url) return null
  try {
    const hostname = new URL(url).hostname
    if (PROXY_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
      const proxied = `/api/proxy/image?url=${encodeURIComponent(url)}`
      console.log('[proxyImage]', url.slice(0, 60), '→', proxied.slice(0, 60))
      return proxied
    }
  } catch {}
  return url
}
