import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'

export async function POST(req: Request) {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('push_subscriptions')
    .update({ is_admin: true })
    .eq('endpoint', endpoint)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
