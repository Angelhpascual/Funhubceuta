import { NextResponse } from 'next/server'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { STANDINGS_CURRENT_SEASON } from '@/lib/constants'
import { apiError } from '@/lib/apiError'

const repo = new MatchesSupabaseRepository()

export async function GET() {
  try {
    const { upcoming, results } = await repo.fetchSeasonMatches(STANDINGS_CURRENT_SEASON)
    return NextResponse.json({ upcoming, results })
  } catch (err) {
    return apiError(err)
  }
}
