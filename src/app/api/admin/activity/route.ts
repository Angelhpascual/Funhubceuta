import { NextResponse } from 'next/server'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { getRecentCronLogs } from '@/infrastructure/supabase/AdminStatsRepository'

export async function GET() {
  if (!(await checkAdminAuth())) {
    return unauthorizedResponse()
  }

  const logs = await getRecentCronLogs(30)
  return NextResponse.json({ logs })
}
