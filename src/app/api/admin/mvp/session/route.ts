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

    sendPush({
      title: '⭐ Vota al MVP del partido',
      body: session?.jornada
        ? `${session.match_label} · ${session.jornada}`
        : session?.match_label ?? 'Votación abierta',
      tag: 'mvp',
      url: '/',
    }).catch(() => {})

    return NextResponse.json({ ok: true })
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
