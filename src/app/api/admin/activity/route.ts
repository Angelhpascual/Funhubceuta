import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'

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

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabaseAdmin
    .from('cron_logs')
    .select('id, created_at, cron_type, status, duration_ms, details')
    .order('created_at', { ascending: false })
    .limit(30)

  return NextResponse.json({ logs: data ?? [] })
}
