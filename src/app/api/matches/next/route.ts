import { NextResponse } from 'next/server'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'

const repo = new MatchesSupabaseRepository()

export async function GET() {
  const match = await repo.getNextMatch()
  return NextResponse.json({ match })
}
