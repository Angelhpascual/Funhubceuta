import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function deriveToken(password: string): string {
  return createHash('sha256').update(password + 'funhub-admin-v1').digest('hex')
}

async function isAuthed(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token || !process.env.ADMIN_PASSWORD) return false
  return token === deriveToken(process.env.ADMIN_PASSWORD)
}

export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const name = (formData.get('name') as string | null) ?? 'player'

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  // Convert to WebP
  const sharp = (await import('sharp')).default
  const webpBuffer = await sharp(buffer)
    .resize(400, 400, { fit: 'cover', position: 'top' })
    .webp({ quality: 80 })
    .toBuffer()

  const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const path = `transfers/${slug}-${Date.now()}.webp`

  const { error } = await supabaseAdmin.storage.from('news-images').upload(path, webpBuffer, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabaseAdmin.storage.from('news-images').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
