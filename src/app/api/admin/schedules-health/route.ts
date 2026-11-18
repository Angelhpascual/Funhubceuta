import { NextResponse } from 'next/server'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { getScheduleHealth } from '@/infrastructure/cron/scheduleHealth'

export async function GET() {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  try {
    const health = await getScheduleHealth()
    return NextResponse.json({ ok: true, ...health })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
