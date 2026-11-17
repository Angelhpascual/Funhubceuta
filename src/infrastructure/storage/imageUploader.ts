import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { logCron } from '@/infrastructure/supabase/logCron'
import { decodeEntities } from '@/lib/decodeEntities'

// Use service role key for storage uploads
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder'
)

const BUCKET = 'news-images'
export const PLAYER_BUCKET = 'player-photos'
const SUPABASE_HOST_RE = /\.supabase\.co$/i

export function isStoredNewsImage(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    return SUPABASE_HOST_RE.test(new URL(url).hostname)
  } catch {
    return false
  }
}

export function newsImageFilename(source: string, externalId: string): string {
  const safeSource = source.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')
  const hash = createHash('sha1').update(externalId).digest('hex').slice(0, 16)
  return `${safeSource || 'news'}-${hash}`
}

export async function downloadAndUploadImage(
  rawSourceUrl: string,
  filename: string,
  options: { bucket?: string; maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<string | null> {
  const {
    bucket = BUCKET,
    maxWidth = 800,
    maxHeight,
    quality = 75,
  } = options
  // RssFetcher decodes entities at scrape time, but any URL stored before
  // that fix (e.g. AS.com's &amp;-escaped auth= params) stays broken in the
  // DB forever and the backfill crons just re-fetch the same literal
  // `&amp;` on every retry — found live: 6 AS.com rows dating back to
  // August stuck in a permanent fail loop, invisible because each retry
  // logged the same generic HTTP 400 as any other transient failure.
  // Decoding here means a legacy broken URL self-heals on its next retry
  // instead of needing a one-off manual SQL fix.
  const sourceUrl = decodeEntities(rawSourceUrl)
  // Every failure path used to return null with zero diagnostic trail — three
  // consecutive backfill-images runs silently optimized 0 of 12 pending rows
  // with no way to tell whether the fetch, sharp, or the storage upload was
  // the culprit. Each failure now gets its own cron_logs row with the real
  // reason, fire-and-forget so it never affects the caller's control flow.
  const logFailure = (stage: string, detail: string) => {
    logCron('image-download-error', 'error', 0, { sourceUrl, filename, stage, detail }).catch(() => {})
  }

  try {
    // Root cause of the laverdaddeceuta.com "fetch failed"/HTTP 400 errors
    // logged under cron_type='image-download-error': their WAF blocks this
    // exact spoofed-Chrome UA string specifically — confirmed by curl: the
    // same request 200s with a generic/bot UA or none at all, and fails
    // consistently only when claiming to be a real Chrome browser (likely a
    // TLS-fingerprint mismatch check). Vercel's fetch runtime has the same
    // mismatch, so it got blocked the same way in production.
    const res = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FunHubCeutaBot/1.0; +https://adceutainfo.vercel.app)',
        Referer: new URL(sourceUrl).origin + '/',
      },
    })

    if (!res.ok) {
      logFailure('fetch', `HTTP ${res.status} ${res.statusText}`)
      return null
    }

    const buffer = Buffer.from(await res.arrayBuffer())

    const sharp = (await import('sharp')).default
    let webpBuffer: Buffer
    try {
      webpBuffer = await sharp(buffer)
        .resize(maxWidth, maxHeight, { withoutEnlargement: true, fit: 'inside' })
        // effort 6 (max) squeezes noticeably more out of webp at the same
        // quality than the default (4) — pure size reduction, no visible
        // cost, and this only runs async in a cron so the slower encode is free.
        .webp({ quality, effort: 6 })
        .toBuffer()
    } catch (err) {
      logFailure('sharp', String(err))
      return null
    }

    const path = `${filename}.webp`

    const { error } = await supabaseAdmin.storage.from(bucket).upload(path, webpBuffer, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true,
    })

    if (error) {
      logFailure('upload', error.message)
      return null
    }

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  } catch (err) {
    logFailure('unexpected', String(err))
    return null
  }
}
