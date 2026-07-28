import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { apiError } from '@/lib/apiError'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'

export async function POST(request: Request) {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  try {
    const { sessionId } = await request.json()
    if (!sessionId) return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 })
    const { error } = await supabaseAdmin
      .from('prediction_sessions')
      .update({ status: 'archived' })
      .eq('id', sessionId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
