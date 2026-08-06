import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { withApi } from '@/lib/apiError'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const POST = withApi(async (request: Request) => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const name = (formData.get('name') as string | null) ?? 'player'

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

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
})
