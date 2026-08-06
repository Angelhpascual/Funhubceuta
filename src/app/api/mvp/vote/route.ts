import { NextResponse } from 'next/server'
import { castMvpVote, hasVoted, getActiveMvpSession } from '@/infrastructure/supabase/MvpRepository'
import { withApi } from '@/lib/apiError'

export const POST = withApi(async (request: Request) => {
  const { sessionId, candidateId, fingerprint } = await request.json()

  if (!sessionId || !candidateId || !fingerprint) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const session = await getActiveMvpSession()
  if (!session || session.id !== sessionId || session.status !== 'open') {
    return NextResponse.json({ error: 'Votación no activa' }, { status: 400 })
  }

  const voted = await hasVoted(sessionId, fingerprint)
  if (voted) {
    return NextResponse.json({ error: 'Ya has votado' }, { status: 409 })
  }

  const { error } = await castMvpVote(sessionId, candidateId, fingerprint)
  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Ya has votado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al votar' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
})
