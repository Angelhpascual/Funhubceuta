import { NextResponse } from 'next/server'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { apiError } from '@/lib/apiError'

const repo = new MatchesSupabaseRepository()

export async function GET() {
  try {
    const match = await repo.getNextMatch()
    // Cache 5 min at the edge — next match changes at most once a week
    return NextResponse.json({ match }, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } })
  } catch (err) {
    return apiError(err)
  }
}
