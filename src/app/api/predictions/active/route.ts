import { NextResponse } from 'next/server'
import { getActivePredictionSession, getUserPrediction } from '@/infrastructure/supabase/PredictionRepository'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fingerprint = searchParams.get('fp') ?? ''

  const session = await getActivePredictionSession()
  if (!session) return NextResponse.json({ session: null, mine: null })

  const mine = fingerprint ? await getUserPrediction(session.id, fingerprint) : null

  return NextResponse.json(
    { session, mine },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
