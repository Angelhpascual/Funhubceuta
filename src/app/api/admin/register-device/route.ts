import { NextResponse } from 'next/server'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { markSubscriptionAsAdmin } from '@/infrastructure/supabase/PushSubscriptionsRepository'

export async function POST(req: Request) {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })

  const { error } = await markSubscriptionAsAdmin(endpoint)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
