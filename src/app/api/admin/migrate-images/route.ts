import { NextResponse } from 'next/server'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import {
  downloadAndUploadImage,
  isStoredNewsImage,
  newsImageFilename,
} from '@/infrastructure/storage/imageUploader'
import { fetchOgImage } from '@/infrastructure/rss/fetchOgImage'
import { withApi } from '@/lib/apiError'

export const maxDuration = 60

export const POST = withApi(async (request: Request) => {
  if (!(await checkAdminAuth())) {
    return unauthorizedResponse()
  }

  const body = await request.json().catch(() => ({}))
  const batchSize = 10
  const offset = (body.offset as number) ?? 0

  // Fetch articles without a stored image (null or external URL)
  const { data: rows, error } = await supabaseAdmin
    .from('news')
    .select('id, external_id, source, url, image_url')
    .order('created_at', { ascending: false })
    .range(offset, offset + batchSize - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let migrated = 0
  let failed = 0
  let skipped = 0

  for (const row of rows ?? []) {
    // Already in Supabase Storage — skip
    if (isStoredNewsImage(row.image_url)) { skipped++; continue }

    // Determine source URL: use existing image_url or fetch OG from article URL
    let sourceUrl: string | null = row.image_url ?? null
    if (!sourceUrl && row.url) {
      sourceUrl = await fetchOgImage(row.url)
    }

    if (!sourceUrl) { failed++; continue }

    const filename = newsImageFilename(row.source, row.external_id)
    const storedUrl = await downloadAndUploadImage(sourceUrl, filename)
    if (storedUrl) {
      await supabaseAdmin.from('news').update({ image_url: storedUrl }).eq('id', row.id)
      migrated++
    } else {
      failed++
    }
  }

  const hasMore = (rows ?? []).length === batchSize
  return NextResponse.json({
    ok: true,
    offset,
    migrated,
    failed,
    skipped,
    hasMore,
    nextOffset: offset + batchSize,
  })
})
