import { NextResponse } from 'next/server'
import { getActivePredictionSession, upsertPrediction } from '@/infrastructure/supabase/PredictionRepository'
import { apiError } from '@/lib/apiError'

export async function POST(request: Request) {
  try {
    const { sessionId, fingerprint, home, away } = await request.json()

    if (!sessionId || !fingerprint || home == null || away == null) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }
    if (home < 0 || home > 9 || away < 0 || away > 9) {
      return NextResponse.json({ error: 'Marcador inválido' }, { status: 400 })
    }

    const session = await getActivePredictionSession()
    if (!session || session.id !== sessionId) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }
    if (session.status !== 'open') {
      return NextResponse.json({ error: 'La predicción no está abierta' }, { status: 400 })
    }

    const { error } = await upsertPrediction(sessionId, fingerprint, home, away)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
