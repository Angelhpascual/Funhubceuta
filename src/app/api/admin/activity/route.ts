import { NextResponse } from 'next/server'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { getRecentCronLogs } from '@/infrastructure/supabase/AdminStatsRepository'
import { withApi } from '@/lib/apiError'

export const revalidate = 0

export const GET = withApi(async () => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const logs = await getRecentCronLogs(30)
  return NextResponse.json({ logs })
})
