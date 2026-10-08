import { NextResponse } from 'next/server'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import {
  createMvpSession,
  openMvpSession,
  closeMvpSession,
  deleteMvpSession,
  type MvpCandidate,
  type MvpMatchMeta,
} from '@/infrastructure/supabase/MvpRepository'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { sendPush } from '@/infrastructure/push/sendPush'
import { logCron } from '@/infrastructure/supabase/logCron'
import { withApi } from '@/lib/apiError'

// POST /api/admin/mvp/session — create a new session
export const POST = withApi(async (request: Request) => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  const { matchLabel, candidates, matchMeta } = await request.json()
  if (!matchLabel || !Array.isArray(candidates) || candidates.length < 2) {
    return NextResponse.json({ error: 'matchLabel and at least 2 candidates required' }, { status: 400 })
  }

  const { data, error } = await createMvpSession(matchLabel, candidates as MvpCandidate[], matchMeta as MvpMatchMeta | undefined)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session: data })
})

// PATCH /api/admin/mvp/session — open or close a session
export const PATCH = withApi(async (request: Request) => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  const { sessionId, action } = await request.json()
  if (!sessionId || !action) {
    return NextResponse.json({ error: 'sessionId and action required' }, { status: 400 })
  }

  if (action === 'open') {
    const { error } = await openMvpSession(sessionId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: session } = await supabaseAdmin
      .from('mvp_sessions')
      .select('match_label, jornada')
      .eq('id', sessionId)
      .maybeSingle()

    // Session is already open at this point regardless of what happens below —
    // a push failure must not look like the open itself failed. But silently
    // swallowing it (as this used to) means nobody ever learns a vote-open
    // notification didn't go out; log it the same way cron/live's notifyAdmin
    // does, and surface the result so the admin UI can show it too.
    let pushResult: { sent: number; total: number } | { error: string }
    try {
      pushResult = await sendPush({
        title: '⭐ Vota al MVP del partido',
        body: session?.jornada
          ? `${session.match_label} · ${session.jornada}`
          : session?.match_label ?? 'Votación abierta',
        tag: 'mvp',
        url: '/',
      })
    } catch (err) {
      pushResult = { error: String(err) }
      await logCron('mvp-session', 'error', 0, { stage: 'sendPush', error: String(err) })
    }

    return NextResponse.json({ ok: true, push: pushResult })
  }

  if (action === 'close') {
    const { error } = await closeMvpSession(sessionId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
})

// DELETE /api/admin/mvp/session — remove session and hide banner
export const DELETE = withApi(async (request: Request) => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  const { sessionId } = await request.json()
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const { error } = await deleteMvpSession(sessionId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
})
