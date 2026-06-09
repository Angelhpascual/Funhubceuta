export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FunHubCeuta/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/)
    return match?.[1] ?? null
  } catch {
    return null
  }
}
