import { NextResponse } from 'next/server'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { apiError } from '@/lib/apiError'

const repo = new MatchesSupabaseRepository()

export async function GET() {
  try {
    const match = await repo.getNextMatch()
    return NextResponse.json({ match }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } })
  } catch (err) {
    return apiError(err)
  }
}
