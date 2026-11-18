import { NextResponse } from 'next/server'
import {
  upsertSubscription,
  deleteSubscription,
} from '@/infrastructure/supabase/PushSubscriptionsRepository'
import { getAppEnv } from '@/lib/appEnv'

export async function POST(request: Request) {
  const body = await request.json()
  const { endpoint, keys } = body

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  try {
    await upsertSubscription({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: request.headers.get('user-agent'),
      environment: getAppEnv(),
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { endpoint } = await request.json()
  await deleteSubscription(endpoint)
  return NextResponse.json({ ok: true })
}
