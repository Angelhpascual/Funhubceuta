import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { supabase } from '@/infrastructure/supabase/client'
import {
  downloadAndUploadImage,
  isStoredNewsImage,
  newsImageFilename,
} from '@/infrastructure/storage/imageUploader'

function deriveToken(password: string): string {
  return createHash('sha256').update(password + 'funhub-admin-v1').digest('hex')
}

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')?.value
  const password = process.env.ADMIN_PASSWORD
  if (!session || !password) return false
  return session === deriveToken(password)
}

export const maxDuration = 60

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const batchSize = 10
  const offset = (body.offset as number) ?? 0

  const { data: rows, error } = await supabase
    .from('news')
    .select('id, external_id, source, image_url')
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + batchSize - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const pending = (rows ?? []).filter((r) => !isStoredNewsImage(r.image_url))

  let migrated = 0
  let failed = 0
  let skipped = 0

  for (const row of rows ?? []) {
    if (isStoredNewsImage(row.image_url)) { skipped++; continue }
    const filename = newsImageFilename(row.source, row.external_id)
    const storedUrl = await downloadAndUploadImage(row.image_url, filename)
    if (storedUrl) {
      await supabase.from('news').update({ image_url: storedUrl }).eq('id', row.id)
      migrated++
    } else {
      await supabase.from('news').update({ image_url: null }).eq('id', row.id)
      failed++
    }
  }

  const hasMore = (rows ?? []).length === batchSize && pending.length > 0
  return NextResponse.json({
    ok: true,
    offset,
    migrated,
    failed,
    skipped,
    hasMore,
    nextOffset: offset + batchSize,
  })
}
