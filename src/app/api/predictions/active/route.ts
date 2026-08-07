import { NextResponse } from 'next/server'
import { getActivePredictionSession, getUserPrediction } from '@/infrastructure/supabase/PredictionRepository'
import { withApi } from '@/lib/apiError'

export const GET = withApi(async (request: Request) => {
  const { searchParams } = new URL(request.url)
  const fingerprint = searchParams.get('fp') ?? ''

  const session = await getActivePredictionSession()
  // No active session — cacheable for 30s, no personal data involved
  if (!session) return NextResponse.json(
    { session: null, mine: null },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
  )

  const mine = fingerprint ? await getUserPrediction(session.id, fingerprint) : null

  // Active session with personal vote data — must not cache
  return NextResponse.json(
    { session, mine },
    { headers: { 'Cache-Control': 'no-store' } }
  )
})
