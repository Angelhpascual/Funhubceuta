import { NextResponse } from 'next/server'
import { logMvpEvent } from '@/infrastructure/supabase/MvpRepository'
import { withApi } from '@/lib/apiError'

const ALLOWED_EVENTS = ['banner_click', 'sheet_open', 'vote_cast']

export const POST = withApi(async (request: Request) => {
  const { sessionId, event, fingerprint } = await request.json()
  if (!sessionId || !event) return NextResponse.json({ ok: false }, { status: 400 })
  if (!ALLOWED_EVENTS.includes(event)) return NextResponse.json({ ok: false }, { status: 400 })
  await logMvpEvent(sessionId, event, fingerprint ?? null)
  return NextResponse.json({ ok: true })
})
