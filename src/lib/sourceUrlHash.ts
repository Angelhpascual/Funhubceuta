import { createHash } from 'crypto'

// Short, stable fingerprint of an external image URL. Used both to name a
// downloaded photo's storage path (so a changed source gets a new URL and
// isn't served from a stale CDN/browser cache) and, separately, to detect
// "this is the same source we already have" without downloading anything.
export function sourceUrlHash(url: string): string {
  return createHash('sha1').update(url).digest('hex').slice(0, 10)
}
