import { NextResponse } from 'next/server'
import { getActivePredictionSession, getUserPrediction } from '@/infrastructure/supabase/PredictionRepository'
import { withApi } from '@/lib/apiError'

export const revalidate = 0

export const GET = withApi(async (request: Request) => {
  const { searchParams } = new URL(request.url)
  const fingerprint = searchParams.get('fp') ?? ''

  const session = await getActivePredictionSession()
  // No active session. PredictionBanner polls this every 10 min specifically
  // *because* it trusts a Supabase realtime subscription to fire an immediate
  // fetch the instant a session opens — this used to cache the null-session
  // response for 30s, so a realtime-triggered fetch landing inside that
  // window could get served the stale cached {session: null} from the edge
  // instead of hitting the DB, silently defeating the realtime trigger (the
  // sibling mvp/active route never had this caching). No caching now, same
  // as mvp/active.
  if (!session) return NextResponse.json({ session: null, mine: null })

  const mine = fingerprint ? await getUserPrediction(session.id, fingerprint) : null

  // Active session with personal vote data — must not cache
  return NextResponse.json(
    { session, mine },
    { headers: { 'Cache-Control': 'no-store' } }
  )
})
