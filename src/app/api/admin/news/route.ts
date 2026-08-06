import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { withApi } from '@/lib/apiError'

export const GET = withApi(async () => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  const { data, error } = await supabaseAdmin
    .from('news')
    .select('id, title, source, published_at, image_url, url, published, notify_queued')
    .eq('discarded', false)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
})

export const DELETE = withApi(async (req: Request) => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('news')
    .update({ published: false, notify_queued: false, discarded: true })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/')
  revalidatePath('/noticias')

  return NextResponse.json({ ok: true })
})
