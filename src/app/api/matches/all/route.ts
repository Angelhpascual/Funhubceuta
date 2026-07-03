import { NextResponse } from 'next/server'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { STANDINGS_CURRENT_SEASON } from '@/lib/constants'
import { apiError } from '@/lib/apiError'

const repo = new MatchesSupabaseRepository()

export async function GET() {
  try {
    const { upcoming, results } = await repo.fetchSeasonMatches(STANDINGS_CURRENT_SEASON)
    return NextResponse.json({ upcoming, results }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } })
  } catch (err) {
    return apiError(err)
  }
}
