import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { APP_ENV } from '@/lib/appEnv'

export async function POST(request: Request) {
  try {
    const { sessionId, event, fingerprint } = await request.json()
    if (!sessionId || !event) return NextResponse.json({ ok: false }, { status: 400 })
    const allowed = ['banner_click', 'sheet_open', 'vote_cast']
    if (!allowed.includes(event)) return NextResponse.json({ ok: false }, { status: 400 })
    await supabaseAdmin.from('mvp_events').insert({ session_id: sessionId, event, fingerprint: fingerprint ?? null, environment: APP_ENV })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
