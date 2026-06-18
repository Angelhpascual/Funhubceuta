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

export async function POST() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all news with external image_url (not already in Supabase Storage)
  const { data: rows, error } = await supabase
    .from('news')
    .select('id, external_id, source, image_url')
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const pending = (rows ?? []).filter((r) => !isStoredNewsImage(r.image_url))

  let migrated = 0
  let failed = 0

  for (const row of pending) {
    const filename = newsImageFilename(row.source, row.external_id)
    const storedUrl = await downloadAndUploadImage(row.image_url, filename)
    if (storedUrl) {
      await supabase.from('news').update({ image_url: storedUrl }).eq('id', row.id)
      migrated++
    } else {
      // If download fails, null out the broken URL so it doesn't show a broken image
      await supabase.from('news').update({ image_url: null }).eq('id', row.id)
      failed++
    }
  }

  return NextResponse.json({ ok: true, total: pending.length, migrated, failed })
}
