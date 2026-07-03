import { NextResponse } from 'next/server'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'

export async function GET() {
  if (!(await checkAdminAuth())) {
    return unauthorizedResponse()
  }

  const { data } = await supabaseAdmin
    .from('cron_logs')
    .select('id, created_at, cron_type, status, duration_ms, details')
    .order('created_at', { ascending: false })
    .limit(30)

  return NextResponse.json({ logs: data ?? [] })
}
