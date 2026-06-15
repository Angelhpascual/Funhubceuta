import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

// Use service role key for storage uploads
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder'
)

const BUCKET = 'news-images'
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
  sourceUrl: string,
  filename: string
): Promise<string | null> {
  try {
    // Download image from source (server-side, bypasses hotlink protection)
    const res = await fetch(sourceUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        Referer: new URL(sourceUrl).origin + '/',
      },
    })

    if (!res.ok) return null

    const buffer = Buffer.from(await res.arrayBuffer())

    // Convert to WebP and resize to max 800px wide
    const sharp = (await import('sharp')).default
    const webpBuffer = await sharp(buffer)
      .resize(800, undefined, { withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer()

    const path = `${filename}.webp`

    // Upload to Supabase Storage
    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, webpBuffer, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true,
    })

    if (error) {
      console.error('[imageUploader] Upload error:', error.message)
      return null
    }

    // Return public URL
    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  } catch (err) {
    console.error('[imageUploader] Error:', err)
    return null
  }
}
