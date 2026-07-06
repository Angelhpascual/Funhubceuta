import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'

export async function DELETE(req: Request) {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await supabaseAdmin.from('news').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidateTag('news')

  return NextResponse.json({ ok: true })
}
