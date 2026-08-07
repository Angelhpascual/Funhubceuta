import { NextResponse } from 'next/server'
import { castMvpVote, hasVoted, getActiveMvpSession } from '@/infrastructure/supabase/MvpRepository'
import { withApi } from '@/lib/apiError'

// In-memory rate limit: max 5 attempts per IP per minute
const ipAttempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    ipAttempts.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export const POST = withApi(async (request: Request) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un momento.' }, { status: 429 })
  }

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
