import { createClient } from '@supabase/supabase-js'

// Use service role key for storage uploads
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'news-images'

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
